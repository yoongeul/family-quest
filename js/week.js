window.renderWeek = function () {
  const root = document.getElementById("weekView");
  const selectedChild = getSelectedChild();
  const mon = mondayOf(getSelectedDate());

  const dates = [0, 1, 2, 3, 4].map(i => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });

  // 이번 주에 등록된 교재 일정 모으기
  const studyTaskMap = new Map();

  dates.forEach(date => {
    const dailyTasks = tasksFor(data.selectedChildId, date);

    dailyTasks
      .filter(task =>
        task.category === "공부" ||
        task.category === "영어책 읽기"
      )
      .forEach(task => {
        studyTaskMap.set(task.id, task);
      });
  });

  const studyTasks = [...studyTaskMap.values()];

  root.innerHTML = `
    <div class="card weekly-plan-card">
      <div class="section-title weekly-plan-title">
        <div>
          <h2>${esc(selectedChild?.name || "")}의 주간 학습 계획</h2>
          <div class="small muted">
            ${mon.getMonth() + 1}월 ${mon.getDate()}일 주간
          </div>
        </div>
      </div>

      ${
        studyTasks.length
          ? `
            <div class="weekly-plan-scroll">
              <div class="weekly-plan-table">

                <div class="weekly-plan-header book-header">
                  교재
                </div>

                ${dates.map(date => `
                  <div class="weekly-plan-header">
                    <strong>${DAYS[date.getDay()]}</strong>
                    <span>
                      ${date.getMonth() + 1}/${date.getDate()}
                    </span>
                  </div>
                `).join("")}

                ${studyTasks.map(task => `
                  <div class="weekly-book-name">
                    <strong>${esc(task.name)}</strong>
                  </div>

                  ${dates.map(date => {
                    const dateStr = ymd(date);
                    const isScheduled = task.days?.includes(date.getDay());

                    return `
                      <div class="
                        weekly-plan-cell
                        ${isScheduled ? "" : "not-scheduled"}
                      ">
                        ${
                          isScheduled
                            ? `
                              <input
                                type="text"
                                class="weekly-plan-input"
                                placeholder="${
                                  /영어책\s*\d+권/.test(task.name)
                                    ? "읽은 책"
                                    : "계획 입력"
                                }"
                                value="${esc(getProgressNote(task.id, dateStr))}"
                                onchange="saveProgressNote(
                                  '${task.id}',
                                  '${dateStr}',
                                  this.value
                                )"
                              >
                            `
                            : `
                              <span class="weekly-plan-off">—</span>
                            `
                        }
                      </div>
                    `;
                  }).join("")}
                `).join("")}

              </div>
            </div>
          `
          : `
            <div class="empty">
              등록된 공부 교재가 없어요 🌿
            </div>
          `
      }
    </div>
  `;
}
