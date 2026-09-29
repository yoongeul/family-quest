const MORNING_ROUTINE = [
  { icon: "🚽", name: "화장실" },
  { icon: "🍚", name: "아침 먹기" },
  { icon: "🧼", name: "세수하기" },
  { icon: "🪥", name: "양치하기" },
  { icon: "🧴", name: "로션 바르기" },
  { icon: "👕", name: "옷 입기" },
  { icon: "💧", name: "물통 챙기기" },
  { icon: "🎒", name: "준비물 챙기기" },
  { icon: "💇", name: "머리 정리하기" },
  { icon: "👟", name: "출발 준비" }
];

let morningDone = new Set();

function renderMorning() {
  const root = document.getElementById("morningView");
  if (!root) return;

  const selectedChild = getSelectedChild();
  const doneCount = morningDone.size;

  root.innerHTML = `
    <div class="morning-board">

      <div class="morning-title">
        <div>
          <span>🌞</span>
          <strong>${esc(selectedChild?.name || "")}의 아침 준비</strong>
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
            >
              <span class="morning-icon">
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

function toggleMorningRoutine(index) {
  if (morningDone.has(index)) {
    morningDone.delete(index);
  } else {
    morningDone.add(index);
  }

  renderMorning();
}

