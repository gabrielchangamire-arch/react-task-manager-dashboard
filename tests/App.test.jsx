import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { makeTask } from "./helpers.js";

vi.mock("../src/services/api.js", () => ({
  tasksApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    health: vi.fn(),
  },
}));

import App from "../src/App.jsx";
import { tasksApi } from "../src/services/api.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("App: initial render", () => {
  it("renders the dashboard header", async () => {
    tasksApi.list.mockResolvedValue([]);
    render(<App />);

    expect(screen.getByRole("heading", { name: /task manager/i })).toBeInTheDocument();
    await waitFor(() => expect(tasksApi.list).toHaveBeenCalledTimes(1));
  });

  it("shows the empty state when there are no tasks", async () => {
    tasksApi.list.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no tasks here yet/i)).toBeInTheDocument();
    });
  });

  it("renders tasks returned by the API", async () => {
    tasksApi.list.mockResolvedValue([
      makeTask({ title: "buy milk", status: "pending" }),
      makeTask({ title: "ship pr", status: "done" }),
    ]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("buy milk")).toBeInTheDocument();
      expect(screen.getByText("ship pr")).toBeInTheDocument();
    });
  });
});

describe("App: error states", () => {
  it("shows an error banner when the initial load fails", async () => {
    tasksApi.list.mockRejectedValue(new Error("could not reach the API. is the backend running?"));
    render(<App />);

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(/could not reach the api/i);
  });

  it("dismisses the error when the user clicks dismiss", async () => {
    const user = userEvent.setup();
    tasksApi.list.mockRejectedValue(new Error("backend unreachable"));
    render(<App />);

    const banner = await screen.findByRole("alert");
    expect(banner).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss error/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("retries fetching when the retry button is clicked", async () => {
    const user = userEvent.setup();
    tasksApi.list.mockRejectedValueOnce(new Error("network fail")).mockResolvedValueOnce([
      makeTask({ title: "loaded after retry" }),
    ]);
    render(<App />);

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText("loaded after retry")).toBeInTheDocument();
    });
    expect(tasksApi.list).toHaveBeenCalledTimes(2);
  });
});

describe("App: creating a task", () => {
  it("submits the form, calls the API, and prepends the new task", async () => {
    const user = userEvent.setup();
    tasksApi.list.mockResolvedValue([]);
    const created = makeTask({ title: "first task" });
    tasksApi.create.mockResolvedValue(created);

    render(<App />);
    await waitFor(() => expect(tasksApi.list).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/task title/i), "first task");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(tasksApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "first task" }),
      );
    });
    expect(await screen.findByText("first task")).toBeInTheDocument();
  });

  it("blocks submit when the title is empty and shows a validation error", async () => {
    const user = userEvent.setup();
    tasksApi.list.mockResolvedValue([]);

    render(<App />);
    await waitFor(() => expect(tasksApi.list).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(tasksApi.create).not.toHaveBeenCalled();
  });
});

describe("App: filtering tasks", () => {
  it("shows only active tasks when 'active' filter is selected", async () => {
    const user = userEvent.setup();
    tasksApi.list.mockResolvedValue([
      makeTask({ title: "active task", status: "pending" }),
      makeTask({ title: "completed task", status: "done" }),
    ]);
    render(<App />);

    await screen.findByText("active task");

    await user.click(screen.getByRole("button", { name: /^active/i }));

    expect(screen.getByText("active task")).toBeInTheDocument();
    expect(screen.queryByText("completed task")).not.toBeInTheDocument();
  });

  it("shows only completed tasks when 'completed' filter is selected", async () => {
    const user = userEvent.setup();
    tasksApi.list.mockResolvedValue([
      makeTask({ title: "active one", status: "pending" }),
      makeTask({ title: "done one", status: "done" }),
    ]);
    render(<App />);

    await screen.findByText("active one");

    await user.click(screen.getByRole("button", { name: /^completed/i }));

    expect(screen.queryByText("active one")).not.toBeInTheDocument();
    expect(screen.getByText("done one")).toBeInTheDocument();
  });

  it("filter counts reflect the underlying tasks", async () => {
    tasksApi.list.mockResolvedValue([
      makeTask({ title: "a", status: "pending" }),
      makeTask({ title: "b", status: "pending" }),
      makeTask({ title: "c", status: "done" }),
    ]);
    render(<App />);

    await screen.findByText("a");

    expect(screen.getByLabelText("3 items")).toBeInTheDocument();
    expect(screen.getByLabelText("2 items")).toBeInTheDocument();
    expect(screen.getByLabelText("1 items")).toBeInTheDocument();
  });
});

describe("App: task completion", () => {
  it("toggles a task to done when the checkbox is clicked", async () => {
    const user = userEvent.setup();
    const task = makeTask({ title: "toggle me", status: "pending" });
    tasksApi.list.mockResolvedValue([task]);
    tasksApi.update.mockResolvedValue({ ...task, status: "done" });

    render(<App />);
    const checkbox = await screen.findByLabelText(/^task: toggle me$/i);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    await waitFor(() => {
      expect(tasksApi.update).toHaveBeenCalledWith(task.id, { status: "done" });
    });
    expect(await screen.findByLabelText(/^task: toggle me$/i)).toBeChecked();
  });

  it("toggles a done task back to pending", async () => {
    const user = userEvent.setup();
    const task = makeTask({ title: "untoggle", status: "done" });
    tasksApi.list.mockResolvedValue([task]);
    tasksApi.update.mockResolvedValue({ ...task, status: "pending" });

    render(<App />);
    const checkbox = await screen.findByLabelText(/^task: untoggle$/i);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    await waitFor(() => {
      expect(tasksApi.update).toHaveBeenCalledWith(task.id, { status: "pending" });
    });
  });

  it("shows an error if toggling fails", async () => {
    const user = userEvent.setup();
    const task = makeTask({ title: "fail me", status: "pending" });
    tasksApi.list.mockResolvedValue([task]);
    tasksApi.update.mockRejectedValue(new Error("update failed"));

    render(<App />);
    const checkbox = await screen.findByLabelText(/^task: fail me$/i);
    await user.click(checkbox);

    await screen.findByText(/update failed/i);
  });
});

describe("App: deleting a task", () => {
  it("removes the task from the list after a successful delete", async () => {
    const user = userEvent.setup();
    const task = makeTask({ title: "delete me" });
    tasksApi.list.mockResolvedValue([task]);
    tasksApi.remove.mockResolvedValue();

    render(<App />);
    await screen.findByText("delete me");

    await user.click(screen.getByRole("button", { name: /delete task/i }));

    await waitFor(() => {
      expect(tasksApi.remove).toHaveBeenCalledWith(task.id);
      expect(screen.queryByText("delete me")).not.toBeInTheDocument();
    });
  });
});
