import "./style.css";

import { el, clear, icon, mark, ICON_TRASH } from "./dom.js";
import { createComposer } from "./composer.js";
import { createRail } from "./rail.js";
import {
  addSession,
  createManager,
  getState,
  hasSessionAt,
  removeSession,
  subscribe,
} from "./store.js";
import {
  formatClock,
  formatSpan,
  nowMinutes,
  parseCommand,
  resolveDay,
} from "./time.js";

const root = document.querySelector("#app");

/* ---------------------------------------------------------------- view: gate */

function renderGate() {
  const name = el("input", {
    class: "field",
    type: "text",
    placeholder: "Weekdays",
    maxLength: 40,
    "aria-label": "Name this manager",
  });

  const form = el(
    "form",
    {
      class: "gate__form",
      onsubmit: (event) => {
        event.preventDefault();
        createManager(name.value.trim() || "Untitled day");
      },
    },
    [
      el("label", { class: "eyebrow", text: "Name this manager" }),
      el("div", { class: "gate__row" }, [
        name,
        el("button", { class: "btn btn--primary btn--tall", type: "submit", text: "Create manager" }),
      ]),
      el("p", {
        class: "hint",
        text: "One manager holds one day. You can bind sessions to it right after.",
      }),
    ]
  );

  root.replaceChildren(
    el("main", { class: "gate" }, [
      el("div", { class: "gate__inner" }, [
        mark("mark gate__mark"),
        el("h1", { class: "gate__wordmark" }, [
          el("span", { text: "HEAVENLY" }),
          el("span", { text: "RESTRICTION" }),
        ]),
        el("div", { class: "gate__rule" }),
        el("p", {
          class: "gate__lede",
          text: "A daily task manager for people who would rather bind the day than negotiate with it. Sessions run your commands at a fixed hour — and hold the machine there if you ask them to.",
        }),
        form,
      ]),
    ])
  );

  name.focus();
}

/* ------------------------------------------------------------- view: manager */

function renderManager() {
  const rail = createRail();

  const stats = {
    sessions: el("span", { class: "stat__value" }),
    blocking: el("span", { class: "stat__value" }),
    bound: el("span", { class: "stat__value" }),
  };

  const composerSlot = el("div", { class: "composer-slot" });
  const listSlot = el("div", { class: "sessions" });

  const newButton = el("button", {
    class: "btn btn--primary",
    type: "button",
    text: "New session",
    onclick: openComposer,
  });

  const topbar = el("header", { class: "topbar" }, [
    mark("mark topbar__mark"),
    el("span", { class: "topbar__name", text: getState().manager.name }),
    el("span", { class: "topbar__sep" }),
    el("span", { class: "eyebrow", text: "Daily task manager" }),
    el("div", { class: "topbar__meta" }, [
      stat(stats.sessions, "sessions"),
      stat(stats.blocking, "blocking"),
      stat(stats.bound, "bound"),
    ]),
  ]);

  const column = el("section", { class: "column" }, [
    el("div", { class: "column__head" }, [
      el("div", {}, [
        el("h1", { class: "column__title", text: "Sessions" }),
        el("p", {
          class: "column__sub",
          text: "Each session holds the day from its start until the next one begins.",
        }),
      ]),
      newButton,
    ]),
    composerSlot,
    listSlot,
  ]);

  root.replaceChildren(
    el("div", { class: "app" }, [topbar, el("div", { class: "workspace" }, [rail.node, column])])
  );

  /* --------------------------------------------------------------- composer */

  function nextSlot() {
    const minutes = nowMinutes();
    const rounded = Math.ceil((minutes + 1) / 30) * 30;
    return { hour: Math.floor(rounded / 60) % 24, minute: rounded % 60 };
  }

  function closeComposer() {
    clear(composerSlot);
    newButton.disabled = false;
    newButton.focus();
  }

  function openComposer() {
    const composer = createComposer({
      defaultTime: nextSlot(),
      onCancel: closeComposer,
      onSave: (draft) => {
        if (hasSessionAt(draft.startMinutes)) {
          return `A session already starts at ${formatClock(draft.startMinutes)}. Pick another minute.`;
        }
        addSession(draft);
        closeComposer();
        return null;
      },
    });

    composerSlot.replaceChildren(composer.node);
    newButton.disabled = true;
    composer.focus();
  }

  /* ------------------------------------------------------------------ render */

  function paint() {
    const day = resolveDay(getState().sessions);

    stats.sessions.textContent = String(day.length);
    stats.blocking.textContent = String(day.filter((s) => s.isBlocking).length);
    stats.bound.textContent = formatSpan(day.reduce((sum, s) => sum + s.spanMinutes, 0));

    rail.render(day);

    if (day.length === 0) {
      listSlot.replaceChildren(
        el("div", { class: "empty" }, [
          el("p", { class: "empty__title", text: "Nothing is bound yet" }),
          el("p", {
            class: "empty__body",
            text: "A session ties a set of commands to a time of day. Create the first one to start shaping the day.",
          }),
        ])
      );
      return;
    }

    listSlot.replaceChildren(...day.map(sessionCard));
  }

  function sessionCard(session) {
    const card = el(
      "article",
      {
        class: `card ${session.isBlocking ? "card--blocking" : ""}`,
        onmouseenter: () => rail.setActive(session.id),
        onmouseleave: () => rail.setActive(null),
      },
      [
        el("div", {}, [
          el("div", { class: "card__time", text: formatClock(session.startMinutes) }),
          el("div", {
            class: "card__span",
            text: `${formatSpan(session.spanMinutes)}${session.spanIsDefault ? " · default" : ""} → ${formatClock(session.endMinutes)}`,
          }),
        ]),

        el(
          "div",
          { class: "card__procs" },
          session.commands.map((line, i) => {
            const { bin, args } = parseCommand(line);
            return el("div", { class: "proc" }, [
              el("span", { class: "proc__index", text: String(i + 1).padStart(2, "0") }),
              el("span", { class: "proc__bin", text: bin }),
              args.length > 0 && el("span", { class: "proc__args", text: args.join(" ") }),
            ]);
          })
        ),

        el("div", { class: "card__side" }, [
          el("span", {
            class: `tag ${session.isBlocking ? "tag--blocking" : ""}`,
            text: session.isBlocking ? "Blocking" : "Open",
          }),
          el(
            "button",
            {
              class: "iconbtn",
              type: "button",
              title: `Delete the ${formatClock(session.startMinutes)} session`,
              "aria-label": `Delete the ${formatClock(session.startMinutes)} session`,
              onclick: () => removeSession(session.id),
            },
            [icon(ICON_TRASH)]
          ),
        ]),
      ]
    );

    return card;
  }

  paint();
  return paint;
}

function stat(valueNode, label) {
  return el("div", { class: "stat" }, [
    valueNode,
    el("span", { class: "stat__label", text: label }),
  ]);
}

/* ---------------------------------------------------------------------- boot */

let repaint = null;
let mountedManager = false;

function mount() {
  const { manager } = getState();

  if (!manager) {
    mountedManager = false;
    repaint = null;
    renderGate();
    return;
  }

  if (!mountedManager) {
    mountedManager = true;
    repaint = renderManager();
    return;
  }

  repaint?.();
}

subscribe(mount);
mount();
