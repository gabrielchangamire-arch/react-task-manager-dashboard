# Interview Notes — react-task-manager-dashboard

A cheat sheet for talking about this project. Read it before any front-end, QA, or full-stack screen.

## 30-second project explanation

> "It's a React dashboard that consumes my own AWS Task Manager API. Vite, plain CSS, axios, no UI framework. Six small components, a service layer that normalizes API errors, env-var config for the backend URL, and 27 tests across Vitest and React Testing Library — unit, integration, and a service-layer suite that mocks axios. It was built to round out my backend work into a full-stack story I can show in a single browser window."

## Architecture

```
┌─────────────────────────┐         ┌────────────────────────┐
│   React + Vite (5173)   │   HTTP  │   FastAPI (8000)       │
│                         │ ──────▶ │   tasks REST endpoints │
│   App                   │         │   SQLAlchemy + SQLite  │
│   ├─ TaskForm           │         │   CORS allows :5173    │
│   ├─ FilterBar          │         └────────────────────────┘
│   ├─ TaskList           │
│   │   └─ TaskItem       │
│   ├─ ErrorBanner        │
│   └─ LoadingSpinner     │
│                         │
│   services/api.js  ◀── axios instance, error normalization
└─────────────────────────┘
```

Three layers in the front-end:

1. **App.jsx** owns state and orchestrates: tasks list, filter, loading, error.
2. **Components** are presentational + lightly stateful (form draft state, edit toggle).
3. **services/api.js** is the only place that knows about HTTP. Throws `Error` instances with friendly messages.

## Main files (what each one is for)

| File | Responsibility |
|---|---|
| `src/App.jsx` | Top-level state, fetch on mount, computed derivations (`visibleTasks`, `counts`), error and loading orchestration |
| `src/components/TaskForm.jsx` | Controlled inputs, client-side title validation, calls `onCreate` |
| `src/components/TaskList.jsx` | Renders `TaskItem`s or the empty state |
| `src/components/TaskItem.jsx` | Toggle, edit (inline), delete; tracks its own `editing` and `busy` state |
| `src/components/FilterBar.jsx` | Three buttons, `aria-pressed`, count badges |
| `src/components/ErrorBanner.jsx` | Shows API error with retry / dismiss |
| `src/components/LoadingSpinner.jsx` | Three pulsing dots; `role="status"` |
| `src/services/api.js` | axios instance + `tasksApi` (list/create/update/remove/health). Normalizes errors |
| `src/styles.css` | All styling. CSS variables, responsive grid |
| `tests/App.test.jsx` | Integration: rendering, filtering, creating, completing, deleting, errors |
| `tests/TaskForm.test.jsx` | Form-level unit tests |
| `tests/FilterBar.test.jsx` | Filter button accessibility + click behavior |
| `tests/api.test.js` | Service layer against mocked axios |

## Data flow

1. **Mount** → `useEffect(refresh, [])` → `tasksApi.list()` → state updated → render.
2. **Create** → `TaskForm.onSubmit` → `App.handleCreate` → `tasksApi.create` → returned task prepended to state.
3. **Toggle** → checkbox in `TaskItem` → `App.handleToggle` → `tasksApi.update(id, { status })` → server response replaces row.
4. **Edit** → click "edit" → component-local `editing` flag → save → `App.handleUpdate` → row replaced.
5. **Delete** → click "delete" → `App.handleDelete` → `tasksApi.remove` → row filtered out.
6. **Error path** → service throws `Error` with friendly message → caught in handler → set on `error` state → `ErrorBanner` shows with retry.

State lives in `App`. Components are dumb except for transient input/UI flags.

## Testing strategy

Three layers, mocked at different boundaries:

1. **App tests (15)**: mock `../src/services/api.js` with `vi.mock`. Renders the real `App` and real components, asserts on user-visible behavior. Selectors are accessibility-first (`getByRole`, `getByLabelText`).
2. **Component tests (6)**: render single components, no service mock needed because the components don't talk to HTTP.
3. **Service tests (6)**: mock `axios` at the module level. Exercise the *real* `tasksApi` to verify error normalization (network errors → friendly message; 404 with `detail` → backend message; etc.).

Why this layering: app-level tests catch regression in the user flow; component-level tests catch regression in a single piece; service-level tests catch regression in HTTP error handling — each layer fast and independent.

Determinism: `cleanup()` after each test (in `tests/setup.js`), no real timers, no real network. The full suite runs in ~15 seconds.

## One bug I might have fixed (good story)

**Bug I caught while writing tests:** my first `handleCreate` looked like:

```js
const handleCreate = async (payload) => {
  await tasksApi.create(payload);
  await refresh(); // re-fetch the whole list
};
```

The test "submits the form, calls the API, and prepends the new task" passed against the real backend, but in the test I was mocking `tasksApi.list` with the *empty array*. So the new task was created (`create` mock called), but the list re-fetched and showed empty. The test failed.

**Fix:** instead of re-fetching, I use the response from `create` and prepend it to local state:

```js
const created = await tasksApi.create(payload);
setTasks((prev) => [created, ...prev]);
```

Two wins: tests pass deterministically, and the user sees the new task immediately without an extra round-trip. The test now reflects how the real UI feels — instant feedback after submit.

## Connection to SDE / QA / Front-End roles

**SDE.** The whole story is full-stack: I built the API, then the contract, then the consumer. I understand env-driven config, CORS, error contracts between layers, and how the same code runs locally and on AWS. An interviewer can ask me to "add field X" and I can speak to the backend (model + schema + migration), the API (route + tests), and the UI (form + display + tests) without hand-waving.

**QA.** Tests are written as specifications, not as coverage chasing. Three layers (unit, integration, service) with each layer mocked at a different boundary so the suite is fast and deterministic. Selectors mirror screen-reader experience. I can talk about test pyramids and the cost of E2E vs. integration vs. unit, and I can explain why I drew the mock line at `services/api.js` rather than at axios for App tests.

**Front-End.** Hooks, component decomposition, accessibility, responsive CSS without a framework, error UX, optimistic UI patterns. I can defend every design choice — why no Redux (state is local), why no Tailwind (project size doesn't justify it), why axios over fetch (uniform error shape).

## Likely questions + short answers

- **Why no TypeScript?** Wanted to keep the focus on React fundamentals and avoid cargo-culting. I'm comfortable adding it; the JSX is shaped to convert cleanly.
- **Why no state library?** State is entirely local to `App`. Adding Redux/Zustand here would be ceremony without benefit.
- **Why optimistic toggle isn't optimistic?** Honest: I prioritized correctness for the demo. Optimistic update with rollback on failure is an obvious next step and I called it out in `Future improvements`.
- **What if a request hangs?** Axios timeout is 8 seconds in `services/api.js`. After that, the user sees a friendly error and can retry.
- **How do you handle CORS?** Backend has FastAPI's `CORSMiddleware` allowing `localhost:5173`. In production we'd add the deployed front-end origin to the allowlist via `CORS_ORIGINS` env var.
- **What's missing for production?** Auth, real CI, Playwright e2e against a deployed backend, attachment UI, observability (e.g. error reporting). All in the README's `Future improvements`.
