const collapsedCategories = new Set();
let editingNoteId = null;

function updateStickyHeights() {
  const header = document.querySelector("header");
  const todayHero = document.getElementById("todayHero");

  if (header) {
    document.documentElement.style.setProperty(
      "--header-height",
      `${header.offsetHeight}px`
    );
  }

  if (todayHero) {
    document.documentElement.style.setProperty(
      "--today-hero-height",
      `${todayHero.offsetHeight}px`
    );
  }
}

function toggleCategory(category) {
  if (collapsedCategories.has(category)) {
    collapsedCategories.delete(category);
  } else {
    collapsedCategories.add(category);
  }

  renderTodayTasks();
}

function renderToday() {
  const root = document.getElementById("todayView");
  const dateStr = ymd(getSelectedDate());

  root.innerHTML = `
    <div id="todayHero"></div>
    <div id="todayNotes"></div>
    <div id="todayTasks"></div>
  `;

  renderTodayTasks();
  renderTodayNotes(dateStr, data.selectedChildId);
  updateStickyHeights();
}

function renderTodayTasks() {
  const heroRoot = document.getElementById("todayHero");
  const tasksRoot = document.getElementById("todayTasks");

  if (!heroRoot || !tasksRoot) return;

  const now = getSelectedDate();
  const dateStr = ymd(now);
  const selectedChild = getSelectedChild();
  const list = tasksFor(data.selectedChildId, now);

  const doneCount = list.filter(task =>
    isDone(task.id, dateStr)
  ).length;

  const pct = list.length
    ? Math.round(doneCount / list.length * 100)
    : 0;

  const categories = [
    ...new Set(list.map(task => task.category))
  ];

  heroRoot.innerHTML = `
  <div class="card hero compact-hero">
    <div class="compact-hero-top">
      <button class="btn compact-btn" onclick="changeDate(-1)">
        ◀
      </button>

      <div class="compact-date">
        <strong>
          ${esc(selectedChild?.name || "")} ·
          ${now.getMonth() + 1}월 ${now.getDate()}일
          (${DAYS[now.getDay()]})
        </strong>

        <input
          class="compact-date-input"
          type="date"
          value="${dateStr}"
          onchange="pickDate(this.value)"
        >
      </div>

      <button class="btn compact-btn" onclick="changeDate(1)">
        ▶
      </button>

      <button class="btn compact-today-btn" onclick="goToday()">
        오늘
      </button>
    </div>

    <div class="compact-progress-row">
      <div class="progress compact-progress">
        <div style="width:${pct}%"></div>
      </div>

      <div class="compact-progress-text">
        <b>${doneCount}/${list.length}</b> · ${pct}%
      </div>
    </div>
  </div>
`;

  tasksRoot.innerHTML =
    categories.map(category => {
      const isCollapsed = collapsedCategories.has(category);

      const rows = list
        .filter(task => task.category === category)
        .map(task => {
          const done = isDone(task.id, dateStr);
          
          const isEnglishReading =
            task.category === "독서";

          const isStudy =
            task.category === "공부" &&
            !isEnglishReading;

          return `
            <div class="task ${isStudy ? "study-task" : ""}">
              <button
                class="check ${done ? "done" : ""}"
                onclick="toggleDone('${task.id}', '${dateStr}')"
                aria-label="완료 체크"
                ${isSaving ? "disabled" : ""}
              >
                ${done ? "✓" : ""}
              </button>

              <div class="
                task-name
                ${done ? "done" : ""}
                ${isEnglishReading ? "english-book-name" : ""}
              ">
                ${esc(task.name)}
              </div>

              ${
                isEnglishReading
                  ? `
                    <input
                      type="text"
                      class="english-book-note"
                      placeholder="읽은 책"
                      value="${esc(
                        getProgressNote(task.id, dateStr)
                      )}"
                      onchange="saveProgressNote(
                        '${task.id}',
                        '${dateStr}',
                        this.value
                      )"
                    />
                  `
                  : ""
              }

              ${
                task.reward
                  ? '<span class="badge">용돈 조건</span>'
                  : ""
              }

              ${
                isStudy
                  ? `
                    <div class="study-progress">
                      <input
                        type="text"
                        class="progress-note"
                        placeholder="진도 입력"
                        value="${esc(
                          getProgressNote(task.id, dateStr)
                        )}"
                        onchange="saveProgressNote(
                          '${task.id}',
                          '${dateStr}',
                          this.value
                        )"
                      />

                      <label class="parent-check">
                        <input
                          type="checkbox"
                          ${
                            isParentChecked(task.id, dateStr)
                              ? "checked"
                              : ""
                          }
                          onchange="toggleParentChecked(
                            '${task.id}',
                            '${dateStr}',
                            this.checked
                          )"
                        />

                        <span>👩🏻 확인완료</span>
                      </label>
                    </div>
                  `
                  : ""
              }
            </div>
          `;
        })
        .join("");

      return `
        <div class="card category-card">
          <button
            type="button"
            class="category-toggle"
            onclick="toggleCategory('${category.replace(/'/g, "\\'")}')"
            aria-expanded="${!isCollapsed}"
          >
            <h2>${esc(category)}</h2>

            <span class="category-toggle-icon">
              ${isCollapsed ? "▼" : "▲"}
            </span>
          </button>

          <div class="category-content ${isCollapsed ? "collapsed" : ""}">
            ${rows}
          </div>
        </div>
      `;
    })
    .join("") ||
    `
      <div class="card empty">
        이 날짜에 등록된 일정이 없어요 🌿
      </div>
    `;
}

function renderNoteBox(type, title, notes) {
  const emptyText =
    type === "notice"
      ? "등록된 공지가 없어요."
      : "등록된 메모가 없어요.";

  const noteRows = notes.length
    ? notes.map(note => `
        <div class="note-row">
          <div class="note-content">
            <span>${esc(note.content)}</span>
          </div>

          <div class="note-actions">
            <button
              type="button"
              class="info-icon-btn"
              onclick="startEditNote(
                '${note.id}',
                '${encodeURIComponent(note.content)}'
                '${type}'
              )"
              aria-label="${title} 수정"
              title="수정"
            >
              ✏️
            </button>

            <button
              type="button"
              class="info-icon-btn"
              onclick="deleteNote('${note.id}')"
              aria-label="${title} 삭제"
              title="삭제"
            >
              🗑️
            </button>
          </div>
        </div>
      `).join("")
    : `<div class="empty">${emptyText}</div>`;

  return `
    <div class="today-info-box ${type}-box">
      <div class="today-info-title">${title}</div>

      <div class="today-info-list">
        ${noteRows}
      </div>

      <button
        type="button"
        class="info-icon-btn info-add-btn"
        onclick="openNoteEditor('${type}')"
        aria-label="${title} 추가"
        title="추가"
      >
        ＋
      </button>
    </div>
  `;
}

async function renderTodayNotes(dateStr, childId) {
  const root = document.getElementById("todayNotes");

  if (!root) return;

  if (!childId) {
    root.innerHTML = `
      <div class="card empty">
        아이를 먼저 선택해 주세요.
      </div>
    `;
    return;
  }

  if (!root.innerHTML.trim()) {
    root.innerHTML = `
      <div class="card note-card">
        <div class="section-title">
          <h2>📣 오늘 알림</h2>
        </div>

        <div class="muted">
         알림을 불러오는 중...
        </div>
      </div>
    `;
  }

  const [
  { data: noticeNotes, error: noticeError },
  { data: memoNotes, error: memoError }
  ] = await Promise.all([
    supabaseClient
      .from("notes")
      .select("id, content, note_type, note_date, created_at")
      .eq("family_id", data.familyId)
      .eq("note_type", "notice")
      .eq("note_date", dateStr)
      .is("child_id", null)
      .order("created_at", { ascending: true }),

    supabaseClient
      .from("notes")
      .select("id, content, note_type, note_date, created_at")
      .eq("family_id", data.familyId)
      .eq("child_id", childId)
      .eq("note_type", "memo")
      .eq("note_date", dateStr)
      .order("created_at", { ascending: true })
  ]);

  const error = noticeError || memoError;

  if (error) {
    console.error("알림 불러오기 실패:", error);

    root.innerHTML = `
      <div class="card note-card">
        <div class="muted">
          알림을 불러오지 못했습니다.
        </div>
      </div>
    `;

    return;
  }

  root.innerHTML = `
  <div class="today-info-bar">
    ${renderNoteBox("notice", "📢 공지", noticeNotes)}
    ${renderNoteBox("memo", "📝 메모", memoNotes)}
    ${renderNoteEditor()}
  </div>
`;
const noteTypeRadios =
  document.querySelectorAll('input[name="noteType"]');

const noticeDateWrap =
  document.getElementById("noticeDateWrap");

const noticeDateInput =
  document.getElementById("noticeDate");

noteTypeRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    const selectedType =
      document.querySelector('input[name="noteType"]:checked')?.value;

    const isNotice = selectedType === "notice";

    noticeDateWrap.style.display =
      isNotice ? "block" : "none";

    if (isNotice && !noticeDateInput.value) {
      noticeDateInput.value = ymd(getSelectedDate());
    }
  });
});

  updateStickyHeights();
}

function renderNoteEditor() {
  return `
    <div id="noteEditor" style="display:none; margin-top:8px;">
      <div class="note-type-picker">
        <label>
          <input
            type="radio"
            name="noteType"
            value="memo"
            checked
          >
          📝 메모
        </label>

        <label>
          <input
            type="radio"
            name="noteType"
            value="notice"
          >
          📢 공지
        </label>
      </div>

      <div id="noticeDateWrap" style="display:none; margin-top:8px;">
        <label for="noticeDate">공지 날짜</label>
        <input
          type="date"
          id="noticeDate"
        >
      </div>

      <textarea
        id="noteInput"
        rows="2"
        placeholder="내용을 입력하세요"
        style="width:100%; resize:vertical;"
      ></textarea>

      <div
        class="toprow"
        style="justify-content:flex-end; margin-top:8px;"
      >
        <button class="btn" onclick="cancelNoteEdit()">
          취소
        </button>

        <button class="btn" onclick="saveNote()">
          저장
        </button>
      </div>
    </div>
  `;
}

function openNoteEditor(type = "memo") {
  editingNoteId = null;

  const editor = document.getElementById("noteEditor");
  const input = document.getElementById("noteInput");
  const typeRadio = document.querySelector(
    `input[name="noteType"][value="${type}"]`
  );

  if (!editor || !input) return;

  input.value = "";

  if (typeRadio) {
    typeRadio.checked = true;
  }

  editor.style.display = "block";
  input.focus();
}

function startEditNote(noteId, encodedContent, type = "memo") {
  editingNoteId = noteId;

  const editor = document.getElementById("noteEditor");
  const input = document.getElementById("noteInput");
  const typeRadio = document.querySelector(
    `input[name="noteType"][value="${type}"]`
  );

  if (!editor || !input) return;

  input.value = decodeURIComponent(encodedContent);

  if (typeRadio) {
    typeRadio.checked = true;
  }

  editor.style.display = "block";
  input.focus();
}

function cancelNoteEdit() {
  editingNoteId = null;

  const editor = document.getElementById("noteEditor");
  const input = document.getElementById("noteInput");

  if (input) {
    input.value = "";
  }

  if (editor) {
    editor.style.display = "none";
  }
}

async function saveNote() {
  const input = document.getElementById("noteInput");
  const content = input?.value.trim();

  if (!content) {
    alert("내용을 입력해 주세요.");
    return;
  }

  const selectedDateStr = ymd(getSelectedDate());
  const childId = data.selectedChildId;

  const noteType =
    document.querySelector('input[name="noteType"]:checked')?.value || "memo";

  // 공지는 지정 날짜, 메모는 현재 보고 있는 날짜
  const noticeDateInput = document.getElementById("noticeDate");

  const noteDate =
    noteType === "notice"
      ? noticeDateInput?.value
      : selectedDateStr;

  if (noteType === "notice" && !noteDate) {
    alert("공지 날짜를 선택해 주세요.");
    return;
  }

  // 메모일 때만 아이 선택이 필요함
  if (noteType === "memo" && !childId) {
    alert("아이를 먼저 선택해 주세요.");
    return;
  }

  const noteData = {
    content,
    note_type: noteType,
    note_date: noteDate,

    // 공지는 가족 공통, 메모는 현재 아이
    child_id: noteType === "notice" ? null : childId
  };

  let error;

  if (editingNoteId) {
    const result = await supabaseClient
      .from("notes")
      .update({
        ...noteData,
        updated_at: new Date().toISOString()
      })
      .eq("id", editingNoteId)
      .eq("family_id", data.familyId);

    error = result.error;
  } else {
    const result = await supabaseClient
      .from("notes")
      .insert({
        family_id: data.familyId,
        ...noteData
      });

    error = result.error;
  }

  if (error) {
    console.error("공지/메모 저장 실패:", error);
    alert(error.message);
    return;
  }

  editingNoteId = null;
  input.value = "";

  await renderTodayNotes(
    selectedDateStr,
    data.selectedChildId
  );
}

async function deleteNote(noteId) {
  const ok = confirm("이 공지/메모를 삭제할까요?");

  if (!ok) return;

  const { error } = await supabaseClient
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("family_id", data.familyId);

  if (error) {
    console.error("공지/메모 삭제 실패:", error);
    alert(error.message);
    return;
  }

  if (editingNoteId === noteId) {
    editingNoteId = null;
  }

  await renderTodayNotes(
    ymd(getSelectedDate()),
    data.selectedChildId
  );
}