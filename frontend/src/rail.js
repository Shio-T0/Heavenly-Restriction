/**
 * The day rail — a 24-hour gauge down the left of the workspace.
 *
 * Each session occupies the rail from its start until the next one begins, so
 * the gaps you see are the hours nothing is bound. Solid segments block the
 * machine; hatched segments leave it free.
 */

import { el, clear } from "./dom.js";
import { MINUTES_IN_DAY, formatClock, nowMinutes } from "./time.js";

const TICK_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const percent = (minutes) => `${(minutes / MINUTES_IN_DAY) * 100}%`;

export function createRail() {
  const track = el("div", { class: "rail__track" });
  const segments = el("div", { class: "rail__segments" });
  const marker = el("div", { class: "rail__marker" });
  const nowLabel = el("span", { class: "rail__now" });

  const ticks = el(
    "div",
    { class: "rail__ticks" },
    TICK_HOURS.map((hour) =>
      el(
        "div",
        {
          class: "rail__tick",
          style: { top: percent(Math.min(hour * 60, MINUTES_IN_DAY)) },
        },
        [el("span", { class: "mono", text: hour === 24 ? "24" : String(hour).padStart(2, "0") }), el("i")]
      )
    )
  );

  const body = el("div", { class: "rail__body" }, [track, ticks, segments, marker]);

  const node = el("aside", { class: "rail" }, [
    el("div", { class: "rail__head" }, [
      el("span", { class: "eyebrow", text: "The day" }),
      nowLabel,
    ]),
    body,
    el("ul", { class: "rail__legend" }, [
      el("li", {}, [el("span", { class: "rail__swatch rail__swatch--open" }), "Open — other work allowed"]),
      el("li", {}, [el("span", { class: "rail__swatch rail__swatch--blocking" }), "Blocking — the machine is held"]),
    ]),
  ]);

  function tickNow() {
    const minutes = nowMinutes();
    marker.style.top = percent(minutes);
    nowLabel.textContent = `now ${formatClock(minutes)}`;
  }

  tickNow();
  setInterval(tickNow, 20_000);

  function render(day) {
    clear(segments);
    for (const session of day) {
      segments.append(
        el("div", {
          class: `rail__seg ${session.isBlocking ? "rail__seg--blocking" : "rail__seg--open"}`,
          dataset: { id: session.id },
          style: {
            top: percent(session.startMinutes),
            height: percent(Math.max(session.endMinutes - session.startMinutes, 6)),
          },
          title: `${formatClock(session.startMinutes)} — ${formatClock(session.endMinutes)}`,
        })
      );
    }
  }

  function setActive(id) {
    for (const seg of segments.children) {
      seg.classList.toggle("is-active", seg.dataset.id === id);
    }
  }

  return { node, render, setActive };
}
