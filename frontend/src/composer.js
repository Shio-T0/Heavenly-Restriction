/**
 * Session composer — three areas, in the order a session is thought about:
 * what runs, when it starts, and how hard it holds the machine.
 */

import { el, icon, mark, ICON_CLOSE, ICON_CHECK } from "./dom.js";
import {
  clampHour,
  clampMinute,
  pad,
  parseCommand,
  toMinutes,
} from "./time.js";

const PRESETS = [
  ["06:30", 6, 30],
  ["09:00", 9, 0],
  ["12:00", 12, 0],
  ["14:30", 14, 30],
  ["18:00", 18, 0],
  ["21:30", 21, 30],
];

export function createComposer({ defaultTime, onSave, onCancel }) {
  /* ---------------------------------------------------------------- processes */

  const rows = el("div", { class: "procs" });
  const count = el("div", { class: "procs__foot" });

  function commandLines() {
    return [...rows.querySelectorAll("input")]
      .map((input) => input.value.trim())
      .filter(Boolean);
  }

  function updateCount() {
    const n = commandLines().length;
    count.textContent =
      n === 0
        ? "no processes yet"
        : `${n} process${n === 1 ? "" : "es"} queued for this session`;
  }

  function addRow(focus = false) {
    const input = el("input", {
      class: "field",
      type: "text",
      spellcheck: false,
      autocapitalize: "off",
      autocomplete: "off",
      placeholder: rows.children.length === 0 ? "code ~/work/thesis" : "another command",
      "aria-label": `Command ${rows.children.length + 1}`,
    });

    const parse = el("span", { class: "procrow__parse" });

    const remove = el(
      "button",
      {
        class: "iconbtn",
        type: "button",
        title: "Remove this command",
        "aria-label": "Remove this command",
        onclick: () => {
          row.remove();
          renumber();
          ensureTrailingRow();
          updateCount();
        },
      },
      [icon(ICON_CLOSE)]
    );

    const row = el("div", { class: "procrow" }, [
      el("span", { class: "procrow__ord" }),
      el("div", { class: "procrow__wrap" }, [input, parse]),
      remove,
    ]);

    input.addEventListener("input", () => {
      const { bin, args } = parseCommand(input.value);
      parse.textContent = bin ? (args.length ? `${args.length} arg${args.length === 1 ? "" : "s"}` : "no args") : "";
      parse.classList.toggle("is-shown", Boolean(bin));
      ensureTrailingRow();
      renumber();
      updateCount();
      clearError();
    });

    /* Enter walks down the queue; from the last, empty row it binds the session. */
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const inputs = [...rows.querySelectorAll("input")];
      const next = inputs[inputs.indexOf(input) + 1];
      if (next) {
        event.preventDefault();
        next.focus();
      } else if (input.value.trim()) {
        event.preventDefault();
        ensureTrailingRow(true);
      }
    });

    rows.append(row);
    renumber();
    if (focus) input.focus();
    return input;
  }

  /* A fresh row opens as soon as the last one carries a command. */
  function ensureTrailingRow(focus = false) {
    const inputs = [...rows.querySelectorAll("input")];
    const last = inputs[inputs.length - 1];
    if (!last || last.value.trim()) addRow(focus);
  }

  function renumber() {
    const all = [...rows.children];
    all.forEach((row, i) => {
      const input = row.querySelector("input");
      row.querySelector(".procrow__ord").textContent = pad(i + 1);
      input.setAttribute("aria-label", `Command ${i + 1}`);
      /* The trailing row is the one waiting to be filled — nothing to remove. */
      row.querySelector(".iconbtn").hidden = i === all.length - 1 && !input.value.trim();
    });
  }

  addRow();
  updateCount();

  /* ------------------------------------------------------------------- clock */

  const hourInput = el("input", {
    class: "clock__unit mono",
    type: "text",
    inputMode: "numeric",
    maxLength: 2,
    value: pad(defaultTime.hour),
    "aria-label": "Start hour",
  });

  const minuteInput = el("input", {
    class: "clock__unit mono",
    type: "text",
    inputMode: "numeric",
    maxLength: 2,
    value: pad(defaultTime.minute),
    "aria-label": "Start minute",
  });

  function bindUnit(input, max, step) {
    input.addEventListener("focus", () => input.select());

    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 2);
      if (input === hourInput && input.value.length === 2) minuteInput.focus();
      clearError();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? step : -step;
      const current = Number(input.value || 0);
      input.value = pad((((current + delta) % (max + 1)) + max + 1) % (max + 1));
    });

    input.addEventListener("blur", () => {
      const n = Number(input.value || 0);
      input.value = pad(Math.min(max, Math.max(0, n)));
    });
  }

  bindUnit(hourInput, 23, 1);
  bindUnit(minuteInput, 59, 5);

  const presets = el(
    "div",
    { class: "presets" },
    PRESETS.map(([label, hour, minute]) =>
      el("button", {
        class: "preset",
        type: "button",
        text: label,
        onclick: () => {
          hourInput.value = pad(hour);
          minuteInput.value = pad(minute);
          clearError();
        },
      })
    )
  );

  /* ------------------------------------------------------------- restriction */

  const blocking = el("input", { type: "checkbox" });

  const restriction = el("label", { class: "switch" }, [
    blocking,
    el("span", { class: "switch__box" }, [icon(ICON_CHECK)]),
    el("span", { class: "switch__text" }, [
      el("span", { class: "switch__name", text: "IS_BLOCKING" }),
      el("span", {
        class: "switch__state switch__state--off",
        text: "The session runs its processes and leaves the machine free for everything else.",
      }),
      el("span", {
        class: "switch__state switch__state--on",
        text: "The machine is held to this session until the next one starts. Nothing else gets through.",
      }),
    ]),
  ]);

  /* ------------------------------------------------------------------ footer */

  const error = el("p", { class: "composer__error", role: "status" });

  function showError(message) {
    error.textContent = message;
    error.classList.add("is-shown");
  }

  function clearError() {
    error.classList.remove("is-shown");
  }

  function save() {
    const commands = commandLines();
    if (commands.length === 0) {
      showError("Add at least one command before binding this session.");
      rows.querySelector("input").focus();
      return;
    }

    const startMinutes = toMinutes(
      clampHour(Number(hourInput.value || 0)),
      clampMinute(Number(minuteInput.value || 0))
    );

    const rejection = onSave({ commands, startMinutes, isBlocking: blocking.checked });
    if (rejection) showError(rejection);
  }

  const node = el("form", {
    class: "composer",
    onsubmit: (event) => {
      event.preventDefault();
      save();
    },
  }, [
    el("header", { class: "composer__head" }, [
      el("div", { class: "composer__title" }, [
        mark("mark topbar__mark"),
        el("span", { text: "New session" }),
      ]),
      el(
        "button",
        {
          class: "iconbtn",
          type: "button",
          title: "Discard this session",
          "aria-label": "Discard this session",
          onclick: onCancel,
        },
        [icon(ICON_CLOSE)]
      ),
    ]),

    area(
      "Processes",
      "Commands run in order when the session opens.",
      el("div", {}, [rows, count])
    ),

    area(
      "Start time",
      "The moment of the day this session is bound to.",
      el("div", {}, [
        el("div", { class: "clock" }, [
          hourInput,
          el("span", { class: "clock__colon", text: ":" }),
          minuteInput,
        ]),
        presets,
      ])
    ),

    area("Restriction", "Off by default.", restriction),

    el("footer", { class: "composer__foot" }, [
      error,
      el("div", { class: "composer__actions" }, [
        el("button", { class: "btn btn--ghost", type: "button", text: "Cancel", onclick: onCancel }),
        el("button", { class: "btn btn--primary", type: "submit" }, [
          "Bind session",
          el("kbd", { text: "↵" }),
        ]),
      ]),
    ]),
  ]);

  return { node, focus: () => rows.querySelector("input").focus() };
}

function area(label, note, body) {
  return el("section", { class: "area" }, [
    el("div", { class: "area__label" }, [
      el("span", { class: "eyebrow", text: label }),
      el("span", { class: "area__note", text: note }),
    ]),
    el("div", { class: "area__body" }, [body]),
  ]);
}
