const MORNING_ROUTINE = [
  { icon: "🚽", name: "화장실" },
  { icon: "🍚", name: "아침 먹기" },
  { icon: "🧼", name: "세수하기" },
  { icon: "🪥", name: "양치하기" },
  { icon: "🧴", name: "로션 바르기" },
  { icon: "👕", name: "옷 입기" },
  { icon: "💧", name: "물통 챙기기" },
  { icon: "🎒", name: "준비물 챙기기" },
  { icon: "💇🏻‍♀️", name: "머리 정리하기" },
  { icon: "💡", name: "불 끄고 출발" }
];

let morningDone = new Set();
let morningLoadedKey = null;
let morningSaving = false;


/* 오늘 날짜 YYYY-MM-DD */
function getMorningDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* 현재 아이 + 오늘 기록 불러오기 */
async function loadMorningProgress() {
  const selectedChild = getSelectedChild();
  if (!selectedChild) return;

  const dateStr = getMorningDate();
  const loadKey = `${selectedChild.id}-${dateStr}`;

  const { data: rows, error } = await supabaseClient
    .from("morning_progress")
    .select("routine_index")
    .eq("child_id", selectedChild.id)
    .eq("date", dateStr);

  if (error) {
    console.error("아침 루틴 불러오기 실패:", error);
    return;
  }

  morningDone = new Set(
    (rows || []).map(row => row.routine_index)
  );

  morningLoadedKey = loadKey;

  renderMorning();
}


/* 화면 그리기 */
function renderMorning() {
  const root = document.getElementById("morningView");
  if (!root) return;

  const selectedChild = getSelectedChild();
  if (!selectedChild) return;

  const dateStr = getMorningDate();
  const loadKey = `${selectedChild.id}-${dateStr}`;

  /*
    아이가 바뀌었거나 날짜가 바뀌었으면
    해당 기록을 DB에서 다시 불러온다.
  */
  if (morningLoadedKey !== loadKey) {
    root.innerHTML = `
      <div class="morning-board">
        <div class="morning-title">
          <div>
            <span>🌞</span>
            <strong>${esc(selectedChild.name || "")}의 아침 준비</strong>
          </div>
        </div>
      </div>
    `;

    loadMorningProgress();
    return;
  }

  const doneCount = morningDone.size;

  root.innerHTML = `
    <div class="morning-board">

      <div class="morning-title">
        <div>
          <span>🌞</span>
          <strong>${esc(selectedChild.name || "")}의 아침 준비</strong>
        </div>

        <span class="morning-count">
          ${doneCount} / ${MORNING_ROUTINE.length}
        </span>
      </div>

      <div class="morning-grid">

        ${MORNING_ROUTINE.map((item, index) => {
          const done = morningDone.has(index);

          return `
            <button
              type="button"
              class="morning-card ${done ? "done" : ""}"
              onclick="toggleMorningRoutine(${index})"
              ${morningSaving ? "disabled" : ""}
            >
              ${
                done
                  ? `
                    <span class="morning-name">
                      ${item.name}
                    </span>

                    <span class="morning-status">
                      완료
                    </span>
                  `
                  : `
                    <span class="morning-icon">
                      ${item.icon}
                    </span>

                    <span class="morning-name">
                      ${item.name}
                    </span>
                  `
              }
            </button>
          `;
        }).join("")}

      </div>

    </div>
  `;
}


/* 완료 / 완료취소 + DB 저장 */
async function toggleMorningRoutine(index) {
  if (morningSaving) return;

  const selectedChild = getSelectedChild();
  if (!selectedChild) return;

  const dateStr = getMorningDate();
  const wasDone = morningDone.has(index);

  morningSaving = true;

  /*
    화면은 먼저 바꿔준다.
    아이가 눌렀을 때 바로 반응하도록.
  */
  if (wasDone) {
    morningDone.delete(index);
  } else {
    morningDone.add(index);
  }

  renderMorning();

  let error;

  if (wasDone) {
    /* 완료 취소 → DB 행 삭제 */

    const result = await supabaseClient
      .from("morning_progress")
      .delete()
      .eq("child_id", selectedChild.id)
      .eq("date", dateStr)
      .eq("routine_index", index);

    error = result.error;

  } else {
    /* 완료 → DB 행 추가 */

    const result = await supabaseClient
      .from("morning_progress")
      .insert({
        child_id: selectedChild.id,
        date: dateStr,
        routine_index: index
      });

    error = result.error;
  }

  if (error) {
    console.error("아침 루틴 저장 실패:", error);

    /* 저장 실패하면 화면도 원래 상태로 복구 */
    if (wasDone) {
      morningDone.add(index);
    } else {
      morningDone.delete(index);
    }
  }

  morningSaving = false;
  renderMorning();

  /* 마지막 루틴까지 모두 완료했을 때 응원 메시지 */
  if (
    !error &&
    !wasDone &&
    morningDone.size === MORNING_ROUTINE.length
  ) {
    showMorningCheer(selectedChild.name);
  }
}

function showMorningCheer(childName) {
  const messages = [
    `${childName}♥️, 오늘도 멋지게 출발! 💛`,
    `${childName}♥️, 준비 끝! 신나는 하루 보내자 ☀️`,
    `${childName}♥️, 오늘도 씩씩하게 다녀와! 🚀`,
    `${childName}♥️, 아침 미션 완벽해! 🌈`,
    `${childName}♥️, 오늘 하루도 파이팅! 💪`
  ];

  const message =
    messages[Math.floor(Math.random() * messages.length)];

  const popup = document.createElement("div");
  popup.className = "morning-cheer-overlay";

  popup.innerHTML = `
    <div class="morning-cheer-popup">
      <div class="morning-cheer-icon">🌟</div>

      <h2>아침 준비 완료!</h2>

      <p>${esc(message)}</p>

      <button
        type="button"
        class="btn primary morning-cheer-btn"
        onclick="this.closest('.morning-cheer-overlay').remove()"
      >
        좋아!
      </button>
    </div>
  `;

  document.body.appendChild(popup);
}