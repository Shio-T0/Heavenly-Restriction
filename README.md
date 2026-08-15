# Heavenly Restriction
 - Restrict yourself for higher productivity

A daily task manager for people who would rather bind the day than negotiate with it.

You define **sessions**: a set of shell commands tied to a time of day. When the clock
reaches a session's start time, its commands are launched. A session holds the day from
its own start until the next one begins — and if it is marked *blocking*... you are locked to doing only that thing until the its duration ends.

> **Status: work in progress.** The scheduler runs and launches commands. Blocking is not
> implemented yet. See [To-Do](#to-do).

---

## Stack

| Layer | What it is |
| --- | --- |
| `core/` | `computer-controler` — Plain Rust backend. |
| `src-tauri/` | `app` — the Tauri v2 shell. Owns the window, the IPC commands, and the scheduler thread. |
| `frontend/` | Vanilla JS + Vite. (Written by Claude... what?, I'm not a frontend dev) |

Rust crates are a Cargo workspace (`core` + `src-tauri`). The frontend is a separate npm
project.

## Requirements

- **Rust 1.85+** (`core` uses edition 2024)
- **Node 18+** and npm
- **Tauri CLI 2.x** — `cargo install tauri-cli --version "^2"`
- Linux: the usual Tauri system dependencies (`webkit2gtk-4.1`, `libappindicator-gtk3`,
  `librsvg`). On Arch: `pacman -S webkit2gtk-4.1 libappindicator-gtk3 librsvg`

## Running

```bash
cd frontend && npm install && cd ..   # once
cargo tauri dev
```

`cargo tauri dev` starts the Vite dev server on port 5173, compiles the Rust side, and
points the app window at it. Frontend edits hot-reload; Rust edits trigger a rebuild and
restart.

```bash
cargo tauri build      # bundles frontend/dist into the binary
```

Useful while working on one half at a time:

```bash
cargo check --workspace          # Rust only
cd frontend && npm run dev       # UI only, in a normal browser at localhost:5173
```

---

## Layout

```
core/src/
  lib.rs        DayList — the day's sessions, ordering, duration derivation, tick()
  session.rs    Session — one time slot; the running latch; Time(u32) → NaiveTime
  exec_list.rs  ExecList — a session's programs; parsing command lines
  program.rs    Program — one binary + args; spawning it

src-tauri/src/
  lib.rs        Tauri builder, scheduler thread, IPC commands, wire types
  main.rs       entry point

frontend/src/
  main.js       views (gate + manager), mounting, repaint
  store.js      state, localStorage, and the IPC seam
  composer.js   the new-session form
  time.js       minutes-since-midnight helpers, day/span resolution
  rail.js       the 24-hour timeline
  dom.js        tiny element helper
```

---

## To-Do

### Correctness

- [ ] `is_blocking`: Create a separate blocked workspace to only allow the predefined tasks to be realized
- [ ] `Program::execute`: Use the `Child` handle to customize
- [ ] `update_durations`: Handle Durations in a better fashion
- [ ] `SpecialDay`: Add one-time events

### Design

- [ ] Replace `update_available` + per-item `replace` with a single-pass `sync` (one sort,
      one pass, deletions for free) and decide deliberately whether an edited session should
      keep its `running` latch
- [ ] Swap the `assert!`/`expect` calls in `Session::new` and `Time` for `Result`, so bad
      input from the UI rejects the promise instead of panicking the scheduler thread
- [ ] Decide who owns the data — `localStorage` is currently the source of truth and Rust
      keeps nothing across restarts - Possibly make it a json or sql.

### Frontend

- [ ] `listen()` for session events so cards can show live status (`"Session Started"` is already defined on Tauri side)
- [ ] Editing an existing session (only create and delete exist today)

### Stupidity

- [ ] No tests anywhere
- [ ] `rust-version` in `src-tauri/Cargo.toml` says 1.77.2, but `core` needs 1.85+
- [ ] CSP is `null` in `tauri.conf.json`
- [ ] `identifier` is still `com.tauri.dev`

### Future Plans
- [ ] Implement Calendars such as from Google, Proton or Notion to automatically template sessions using an AI (final choice by the user);
- [ ] Measure productivity by counting words and calculating against an average of the same section types.
- [ ] Add break suggestions through simple algorithm.
