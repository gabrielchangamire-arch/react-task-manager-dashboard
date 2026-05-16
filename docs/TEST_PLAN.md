# Test Plan

This is the QA plan I would use for the React task manager dashboard. The app is small, but it still has the same kinds of risk as a real front end: user input, API failures, state updates, accessibility, and regression around common task flows.

## Product Areas Under Test

- Task list rendering from the backend response
- Task creation form, including client-side validation
- Inline editing for title and description
- Complete / incomplete toggle behavior
- Delete flow and list refresh behavior
- Filters for all, active, and completed tasks
- Loading, empty, and API error states
- Environment-driven API base URL through `VITE_API_BASE_URL`
- Basic responsive behavior below the mobile breakpoint
- Accessible labels, roles, and pressed/checked states used by the tests

## In Scope

- User-facing task workflows in the dashboard
- API integration behavior at the service wrapper level
- Validation before a request is sent
- Error display, retry, and dismiss behavior
- Regression checks for filter counts and visible task state
- Keyboard/screen-reader-friendly selectors where React Testing Library can verify them

## Out of Scope

- Real browser end-to-end tests against a live backend
- Cross-browser visual testing
- Screenshot comparison or layout pixel checks
- Authentication and multi-user behavior
- S3 attachment upload UI, because the dashboard does not implement that yet
- Load/performance testing beyond normal local usage

## Black-Box Scenarios

These are written from the user's point of view, without depending on component internals:

- A user opens the dashboard and sees tasks returned by the API.
- A user opens the dashboard with no tasks and sees an empty state instead of a broken list.
- A user creates a task with a title and optional description, then sees it appear in the list.
- A user submits an empty or whitespace-only title and gets a validation message without an API call.
- A user filters to active or completed tasks and only sees matching rows.
- A user marks a pending task as done and sees the checkbox/status update.
- A user marks a done task back to pending.
- A user deletes a task and no longer sees it in the list.
- A user sees an error banner when the API is unreachable.
- A user can retry after a failed load and see the recovered data.
- A user can dismiss an error without corrupting the current task list.

## Edge Cases Worth Checking

- Empty task list from the API
- Network failure during first load
- Network failure during create or toggle
- Title made only of spaces
- Description left blank, which should be sent as `null`
- Filter counts after create, delete, or status changes
- Long titles/descriptions wrapping in the task card
- API detail message returned from the backend and surfaced by `tasksApi`
- Invalid or missing `VITE_API_BASE_URL` during local setup

## Regression Areas

- The filter state should not mutate the underlying task array.
- The task counts should reflect all tasks, not just the currently visible list.
- The checkbox state should stay tied to `status`, not local visual state only.
- Retry should call the list endpoint again and replace the error state on success.
- The form should clear only after a successful create.
- Service-level error normalization should keep backend `detail` messages when available.

## Existing Automated Coverage

The current Vitest and React Testing Library suite maps to user-facing behavior this way:

| Test file | Behavior covered |
|---|---|
| `tests/App.test.jsx` | Initial render, empty state, loading data, create flow, validation, filters, counts, toggle, delete, initial load failure, retry, and dismiss. The API module is mocked so the tests focus on React behavior. |
| `tests/TaskForm.test.jsx` | Form-level validation, trimming whitespace, clearing inputs after success, and showing backend errors from `onCreate`. |
| `tests/FilterBar.test.jsx` | Active filter accessibility via `aria-pressed` and calling `onChange` with the next filter. |
| `tests/api.test.js` | `tasksApi` HTTP methods, request URLs, network failure message, and backend `detail` error propagation using a mocked axios instance. |

The automated tests do a good job covering behavior that can be tested in jsdom. I would still manually smoke test layout, keyboard focus, and the full dashboard/API pairing before submitting or demoing the project.

## Representative Test Data

```js
const emptyList = [];

const mixedTasks = [
  { id: "task-1", title: "write proposal", description: "draft by Friday", status: "pending" },
  { id: "task-2", title: "ship PR", description: null, status: "done" },
  { id: "task-3", title: "review test plan", description: "QA pass", status: "pending" },
];

const networkError = new Error("Could not reach the API");
const backendValidationError = new Error("Title is required");
```

## Sample Manual Test Cases

| ID | Scenario | Steps | Expected Result | Automation Status |
|---|---|---|---|---|
| UI-01 | Empty dashboard | Start the API with no tasks, open the dashboard. | Header and form render; empty state is visible; no task cards appear. | Covered in `App.test.jsx`; manual smoke still useful with real API. |
| UI-02 | Create task | Enter `write proposal`, leave description blank, submit. | New task appears near the top with a pending/incomplete state. | Covered with mocked API. |
| UI-03 | Reject blank title | Enter only spaces in the title and submit. | Validation message appears and no create request is made. | Covered in `App.test.jsx` and `TaskForm.test.jsx`. |
| UI-04 | Filter completed | Seed one pending and one done task, click Completed. | Only the done task is visible and filter pressed state updates. | Covered in `App.test.jsx` and `FilterBar.test.jsx`. |
| UI-05 | Recover from API outage | Point `VITE_API_BASE_URL` to a stopped backend, load the page, then restore the backend and click Retry. | Error banner appears first; retry loads tasks after the backend is available. | Retry path covered with mocked API; real outage is manual. |
| UI-06 | Mobile layout check | Open the dashboard under 600px width. | Form and list stack cleanly without controls overlapping. | Manual for now. |

## Notes for Future QA Work

- Add Playwright coverage for one real browser flow against the FastAPI backend.
- Add keyboard-only manual checks for create, filter, toggle, and delete.
- Add a small visual smoke checklist once screenshots exist.
