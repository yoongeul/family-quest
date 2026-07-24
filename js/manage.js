const collapsedManageCategories = new Set();

function toggleManageCategory(categoryId) {
  if (collapsedManageCategories.has(categoryId)) {
    collapsedManageCategories.delete(categoryId);
  } else {
    collapsedManageCategories.add(categoryId);
  }

  renderManage();
}


let bookSectionCollapsed = true;

function toggleBookSection() {
  bookSectionCollapsed = !bookSectionCollapsed;
  renderManage();
}

let scheduleAddSectionCollapsed = true;

function toggleScheduleAddSection() {
  scheduleAddSectionCollapsed = !scheduleAddSectionCollapsed;
  renderManage();
}

function renderManage() {
  const root = document.getElementById("manageView");
  if (!root) return;

  const list = data.tasks.filter(
    task => task.child_id === data.selectedChildId
  );

  const categories = [...(data.categories || [])]
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) -
        (b.sort_order ?? 0)
    );

  root.innerHTML = `
    <!-- 교재 관리 -->
    <div class="card manage-book-card">
      <button
        type="button"
        class="manage-category-toggle"
        onclick="toggleBookSection()"
        aria-expanded="${!bookSectionCollapsed}"
      >
        <span class="manage-category-title">
          <b>📚 교재 관리</b>
        </span>

        <span class="manage-category-arrow">
          ${bookSectionCollapsed ? "▶" : "▼"}
        </span>
      </button>

      <div
        class="formgrid"
        style="${bookSectionCollapsed ? "display:none;" : ""}"
      >
        <div>
          <label>아이</label>

          <select id="bookChildId">
            ${(data.children || []).map(child => `
              <option
                value="${child.id}"
                ${
                  child.id === data.selectedChildId
                    ? "selected"
                    : ""
                }
              >
                ${esc(child.name)}
              </option>
            `).join("")}
          </select>
        </div>

        <div>
          <label>교재명</label>

          <input
            id="bookTitle"
            placeholder="예: 원리셈 C4"
          />
        </div>

        <div>
          <label>진도 방식</label>

          <select
            id="bookProgressType"
            onchange="updateBookProgressFields()"
          >
            <option value="unit">Unit</option>
            <option value="week_day">주 · 일</option>
            <option value="page">Page</option>
          </select>
        </div>

        <div>
          <label>시작일</label>

          <input
            id="bookStartDate"
            type="date"
            value="${ymd(new Date())}"
          />
        </div>

        <div
          id="bookTargetValueField"
          class="full"
        >
          <label id="bookTargetValueLabel">
            전체 Unit 수
          </label>

          <input
            id="bookTargetValue"
            type="number"
            min="1"
            placeholder="예: 20"
          />
        </div>

        <div
          id="bookWeekDayFields"
          class="full book-week-day-fields"
          style="display:none"
        >
          <div>
            <label>전체 주</label>

            <input
              id="bookTargetWeeks"
              type="number"
              min="0"
              placeholder="예: 12"
            />
          </div>

          <div>
            <label>마지막 주의 일</label>

            <input
              id="bookTargetDays"
              type="number"
              min="0"
              placeholder="예: 5"
            />
          </div>

          <div>
            <label>주당 학습일</label>

            <input
              id="bookDaysPerWeek"
              type="number"
              min="1"
              value="5"
            />
          </div>
        </div>

        <div class="full">
          <button
            type="button"
            class="btn primary"
            onclick="addBook()"
          >
            교재 등록
          </button>
        </div>
      </div>
    </div>

    <!-- 새 반복 일정 추가 -->
    <div class="card manage-add">
      <button
        type="button"
        class="manage-category-toggle"
        onclick="toggleScheduleAddSection()"
        aria-expanded="${!scheduleAddSectionCollapsed}"
      >
        <span class="manage-category-title">
          <b>📆 새 반복 일정 추가</b>
        </span>

        <span class="manage-category-arrow">
          ${scheduleAddSectionCollapsed ? "▶" : "▼"}
        </span>
      </button>

      <div
        class="formgrid"
        style="${scheduleAddSectionCollapsed ? "display:none;" : ""}"
      >
        <div>
          <label>분류</label>

          <select id="fCat">
            ${categories.map(category => `
              <option value="${esc(category.name)}">
                ${esc(category.name)}
              </option>
            `).join("")}
          </select>
        </div>

        <div>
          <label>할 일</label>

          <input
            id="fName"
            placeholder="예: 원리셈 2장"
          />
        </div>

        <div class="full">
          <label>반복 요일</label>

          <div class="days" id="dayPick">
            ${[1, 2, 3, 4, 5, 6, 0].map(day => `
              <button
                type="button"
                class="daybtn ${
                  WEEKDAYS.includes(day)
                    ? "active"
                    : ""
                }"
                data-day="${day}"
              >
                ${DAYS[day]}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="full">
          <label>
            <input
              type="checkbox"
              id="fReward"
              style="width:auto"
            >
            주간 용돈 지급 조건에 포함
          </label>
        </div>

        <div class="full">
          <button
            type="button"
            class="btn primary"
            onclick="addTask()"
          >
            일정 추가
          </button>
        </div>
      </div>
    </div>

    <!-- 카테고리별 등록 일정 -->
    <div class="card manage-task-card">
      <div class="section-title">
        <h2>등록된 일정</h2>
        <span class="muted">${list.length}개</span>
      </div>

      ${
        categories.map(category => {
          const categoryTasks = list.filter(
            task => task.category === category.name
          );

          const isCollapsed =
            collapsedManageCategories.has(category.id);

          return `
            <div class="manage-category">
              <button
                type="button"
                class="manage-category-toggle"
                onclick="toggleManageCategory('${category.id}')"
                aria-expanded="${!isCollapsed}"
              >
                <span class="manage-category-title">
                  <b>${esc(category.name)}</b>

                  <span class="manage-category-count">
                    ${categoryTasks.length}
                  </span>
                </span>

                <span class="manage-category-arrow">
                  ${isCollapsed ? "▶" : "▼"}
                </span>
              </button>

              <div class="
                manage-category-content
                ${isCollapsed ? "collapsed" : ""}
              ">
                ${
                  categoryTasks.length
                    ? categoryTasks.map(task => `
                        <div class="manager-item">
                          <div class="manager-task-info">
                            <b>${esc(task.name)}</b>

                            <div class="muted">
                              ${
                                Array.isArray(task.days)
                                  ? task.days
                                      .map(day => DAYS[day])
                                      .join(" ")
                                  : ""
                              }

                              ${
                                task.reward
                                  ? " · 용돈 조건"
                                  : ""
                              }
                            </div>
                          </div>

                          <div class="toolbar">
                            <button
                              type="button"
                              class="btn"
                              onclick="editTaskName('${task.id}')"
                            >
                              수정
                            </button>

                            <button
                              type="button"
                              class="btn danger"
                              onclick="deleteTask('${task.id}')"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      `).join("")
                    : `
                      <div class="empty manage-category-empty">
                        등록된 일정이 없어요.
                      </div>
                    `
                }
              </div>
            </div>
          `;
        }).join("")
      }

      ${
        !categories.length
          ? `
            <div class="empty">
              등록된 카테고리가 없어요.
            </div>
          `
          : ""
      }
    </div>

    <!-- 카테고리 순서 -->
    <div class="card">
      <div class="section-title">
        <h2>카테고리 순서</h2>
      </div>

      ${
        categories.map((category, index) => `
          <div class="manager-item">
            <div>
              <b>${esc(category.name)}</b>
            </div>

            <div class="toolbar">
              <button
                type="button"
                class="btn"
                onclick="moveCategory('${category.id}', -1)"
                ${index === 0 ? "disabled" : ""}
                aria-label="${esc(category.name)} 위로 이동"
              >
                ↑
              </button>

              <button
                type="button"
                class="btn"
                onclick="moveCategory('${category.id}', 1)"
                ${
                  index === categories.length - 1
                    ? "disabled"
                    : ""
                }
                aria-label="${esc(category.name)} 아래로 이동"
              >
                ↓
              </button>
            </div>
          </div>
        `).join("") ||
        `
          <div class="empty">
            등록된 카테고리가 없어요.
          </div>
        `
      }
    </div>

    <!-- 백업 -->
    <div class="card">
      <div class="section-title">
        <h2>백업</h2>
      </div>

      <div class="toolbar">
        <button
          type="button"
          class="btn"
          onclick="exportData()"
        >
          현재 데이터 내보내기
        </button>

        <button
          type="button"
          class="btn"
          onclick="reloadData()"
        >
          Supabase 다시 불러오기
        </button>
      </div>

      <p class="muted">
        일정과 체크 기록은 Supabase에 저장됩니다.
      </p>
    </div>
  `;

  document
    .querySelectorAll("#manageView .daybtn")
    .forEach(button => {
      button.onclick = () => {
        button.classList.toggle("active");
      };
    });
}

function updateBookProgressFields() {
  const progressType =
    document.getElementById("bookProgressType")?.value;

  const valueField =
    document.getElementById("bookTargetValueField");

  const valueLabel =
    document.getElementById("bookTargetValueLabel");

  const valueInput =
    document.getElementById("bookTargetValue");

  const weekDayFields =
    document.getElementById("bookWeekDayFields");

  if (
    !progressType ||
    !valueField ||
    !valueLabel ||
    !valueInput ||
    !weekDayFields
  ) {
    return;
  }

  if (progressType === "week_day") {
    valueField.style.display = "none";
    weekDayFields.style.display = "grid";
    valueInput.value = "";
    return;
  }

  valueField.style.display = "block";
  weekDayFields.style.display = "none";

  if (progressType === "unit") {
    valueLabel.textContent = "전체 Unit 수";
    valueInput.placeholder = "예: 20";
  }

  if (progressType === "page") {
    valueLabel.textContent = "마지막 페이지";
    valueInput.placeholder = "예: 120";
  }
}

function addBook() {
  alert("교재 저장 기능을 연결할 예정입니다.");
}

async function addTask() {
  const name = document.getElementById("fName").value.trim();
  if (!name) {
    alert("할 일을 입력해 주세요.");
    return;
  }

  const days = [...document.querySelectorAll(".daybtn.active")]
    .map(button => Number(button.dataset.day));

  if (!days.length) {
    alert("반복 요일을 하나 이상 선택해 주세요.");
    return;
  }

  const childTasks = data.tasks.filter(t => t.child_id === data.selectedChildId);
  const nextSortOrder = childTasks.length
    ? Math.max(...childTasks.map(t => Number(t.sort_order) || 0)) + 1
    : 1;

  const categoryName = document.getElementById("fCat").value;

  const { data: selectedCategory, error: categoryError } =
   await supabaseClient
    .from("categories")
    .select("id")
    .eq("family_id", data.familyId)
    .eq("name", categoryName)
    .maybeSingle();

  if (categoryError) {
    console.error("카테고리 조회 실패:", categoryError);
    alert("카테고리를 확인하지 못했어요.\n\n" + categoryError.message);
    return;
  }

  if (!selectedCategory) {
    alert(`"${categoryName}" 카테고리를 찾지 못했어요.`);
    return;
  }

const newTask = {
  family_id: data.familyId,
  child_id: data.selectedChildId,
  category_id: selectedCategory.id,
  category: categoryName,
  name,
  days,
  reward_enabled: document.getElementById("fReward").checked,
  reward_points: 0,
  is_active: true,
  sort_order: nextSortOrder
};

  setStatus("일정을 저장하는 중...");

  const { data: inserted, error } = await supabaseClient
    .from("tasks")
    .insert(newTask)
    .select("id, family_id, child_id, name, category, days, reward_enabled, reward_points, is_active, sort_order")
    .single();

  if (error) {
    console.error("일정 추가 실패:", error);
    setStatus("⚠️ 일정 저장 실패");
    alert("일정을 추가하지 못했어요.\n\n" + error.message);
    return;
  }

  data.tasks.push({
    ...inserted,
    days: Array.isArray(inserted.days) ? inserted.days.map(Number) : [],
    reward: !!inserted.reward_enabled
  });

  setStatus("☁️ 일정 저장 완료");
  render();
}

async function editTaskName(taskId) {
  const task = data.tasks.find(task => task.id === taskId);

  if (!task) {
    alert("일정을 찾을 수 없어요.");
    return;
  }

  const input = prompt(
    "일정 이름을 수정해 주세요.",
    task.name
  );

  // 취소 버튼을 누른 경우
  if (input === null) return;

  const nextName = input.trim();

  if (!nextName) {
    alert("일정 이름을 입력해 주세요.");
    return;
  }

  // 기존 이름과 같으면 저장하지 않음
  if (nextName === task.name) return;

  const previousName = task.name;

  task.name = nextName;
  renderManage();
  setStatus("저장 중...");

  try {
    const { error } = await supabaseClient
      .from("tasks")
      .update({
        name: nextName
      })
      .eq("id", taskId);

    if (error) throw error;

    setStatus("☁️ 저장 완료");

    // 오늘·주간 화면에도 수정된 이름 반영
    renderTodayTasks();
    renderWeek();
  } catch (error) {
    console.error("일정 수정 실패:", error);

    task.name = previousName;

    setStatus("⚠️ 저장 실패");
    alert(
      "일정을 수정하지 못했어요.\n\n" +
      error.message
    );

    renderManage();
  }
}

async function deleteTask(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;

  setStatus("일정을 삭제하는 중...");

  const { error } = await supabaseClient
    .from("tasks")
    .update({ is_active: false })
    .eq("id", id)
    .eq("family_id", data.familyId);

  if (error) {
    console.error("일정 삭제 실패:", error);
    setStatus("⚠️ 일정 삭제 실패");
    alert("일정을 삭제하지 못했어요.\n\n" + error.message);
    return;
  }

  data.tasks = data.tasks.filter(task => task.id !== id);
  setStatus("☁️ 일정 삭제 완료");
  render();
}

async function moveCategory(categoryId, direction) {
  const categories = [...data.categories]
    .sort((a, b) => a.sort_order - b.sort_order);

  const currentIndex = categories.findIndex(c => c.id === categoryId);

  if (currentIndex < 0) return;

  const targetIndex = currentIndex + direction;

  if (targetIndex < 0 || targetIndex >= categories.length) return;

  const current = categories[currentIndex];
  const target = categories[targetIndex];

  // sort_order 교환
  const currentOrder = current.sort_order;
  const targetOrder = target.sort_order;

  const { error } = await supabaseClient
    .from("categories")
    .upsert([
      { ...current, sort_order: targetOrder },
      { ...target, sort_order: currentOrder }
    ]);

  if (error) {
    console.error(error);
    alert("카테고리 순서를 저장하지 못했습니다.");
    return;
  }

  // 메모리 값도 변경
  current.sort_order = targetOrder;
  target.sort_order = currentOrder;

  data.categories.sort((a, b) => a.sort_order - b.sort_order);

  // task도 다시 정렬
  data.tasks.sort((a, b) => {
    const ca = data.categories.find(c => c.id === a.category_id)?.sort_order ?? 999;
    const cb = data.categories.find(c => c.id === b.category_id)?.sort_order ?? 999;

    if (ca !== cb) return ca - cb;

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  render();
}