import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TaskForm from "../src/components/TaskForm.jsx";

describe("TaskForm", () => {
  it("clears the title and description after a successful submit", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue();

    render(<TaskForm onCreate={onCreate} />);

    const titleInput = screen.getByLabelText(/^task title$/i);
    const descInput = screen.getByLabelText(/task description/i);

    await user.type(titleInput, "buy milk");
    await user.type(descInput, "2 percent");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(onCreate).toHaveBeenCalledWith({ title: "buy milk", description: "2 percent" });
    expect(titleInput.value).toBe("");
    expect(descInput.value).toBe("");
  });

  it("trims whitespace from the title", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue();

    render(<TaskForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/^task title$/i), "   spaced   ");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(onCreate).toHaveBeenCalledWith({ title: "spaced", description: null });
  });

  it("rejects empty/whitespace-only titles before calling onCreate", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(<TaskForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/^task title$/i), "    ");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  it("surfaces backend errors from onCreate", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error("server hated it"));

    render(<TaskForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/^task title$/i), "x");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByText(/server hated it/i)).toBeInTheDocument();
  });
});
