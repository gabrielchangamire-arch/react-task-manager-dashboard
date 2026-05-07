import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FilterBar from "../src/components/FilterBar.jsx";

describe("FilterBar", () => {
  const counts = { all: 5, active: 3, completed: 2 };

  it("highlights the active filter via aria-pressed", () => {
    render(<FilterBar value="active" onChange={() => {}} counts={counts} />);
    const activeBtn = screen.getByRole("button", { name: /^active/i });
    expect(activeBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^all/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the next filter key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterBar value="all" onChange={onChange} counts={counts} />);

    await user.click(screen.getByRole("button", { name: /^completed/i }));
    expect(onChange).toHaveBeenCalledWith("completed");
  });
});
