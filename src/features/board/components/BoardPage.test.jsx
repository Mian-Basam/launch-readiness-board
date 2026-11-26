import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../../../App.jsx";
import { resetDb } from "../../../mocks/db.js";

function renderApp(path = "/board") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

const column = (name) => screen.getByRole("region", { name });
const waitForBoard = () => screen.findByRole("region", { name: "To Do" });
const card = (title) => screen.getByRole("button", { name: new RegExp(title) });
const dialog = () => screen.getByRole("dialog");

beforeEach(() => {
  resetDb();
  vi.spyOn(Math, "random").mockReturnValue(0.99); // no simulated server failures
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("Board", () => {
  it("shows the sprint and loads issues into four workflow columns", async () => {
    renderApp();
    await waitForBoard();
    expect(screen.getByRole("heading", { name: "LR Sprint 14" })).toBeInTheDocument();
    expect(within(column("To Do")).getByText(/Draft and approve release notes/)).toBeInTheDocument();
    expect(within(column("In Progress")).getByText(/Payment button unresponsive/)).toBeInTheDocument();
    expect(within(column("In Review")).getByText(/Verify checkout flow/)).toBeInTheDocument();
    expect(within(column("Done")).getByText(/XSS safety/)).toBeInTheDocument();
    expect(screen.getByText("5 of 27 points done")).toBeInTheDocument();
  });

  it("moves a focused card with Alt+Arrow keys", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    card("Draft and approve").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");

    await waitFor(() =>
      expect(within(column("In Progress")).getByText(/Draft and approve/)).toBeInTheDocument()
    );
  });

  it("creates an issue inline at the bottom of a column", async () => {
    const user = userEvent.setup();
    renderApp();
    const inProgress = await screen.findByRole("region", { name: "In Progress" });

    await user.click(within(inProgress).getByRole("button", { name: "Create issue" }));
    await user.type(within(inProgress).getByLabelText("Summary"), "Wire up error tracking{Enter}");

    expect(await within(column("In Progress")).findByText("Wire up error tracking")).toBeInTheDocument();
    expect(await screen.findByText("LR-111 created")).toBeInTheDocument();
  });

  it("creates an issue from the Create dialog", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    await user.click(screen.getByRole("button", { name: "Create" }));
    const d = screen.getByRole("dialog", { name: "Create issue" });
    await user.type(within(d).getByLabelText("Summary"), "Update status page copy");
    await user.selectOptions(within(d).getByLabelText("Type"), "bug");
    await user.selectOptions(within(d).getByLabelText("Assignee"), "u2");
    await user.click(within(d).getByRole("button", { name: "Create" }));

    expect(await within(column("To Do")).findByText("Update status page copy")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens an issue, edits fields, comments, and closes with Escape", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    await user.click(card("Draft and approve"));
    const d = dialog();
    expect(within(d).getByText("LR-101")).toBeInTheDocument();

    const summary = within(d).getByLabelText("Summary");
    await user.clear(summary);
    await user.type(summary, "Ship the changelog{Enter}");
    expect(await screen.findByRole("button", { name: /Ship the changelog/ })).toBeInTheDocument();

    await user.selectOptions(within(dialog()).getByLabelText("Status"), "review");
    await waitFor(() =>
      expect(within(column("In Review")).getByText("Ship the changelog")).toBeInTheDocument()
    );

    await user.selectOptions(within(dialog()).getByLabelText("Priority"), "low");
    await user.click(within(dialog()).getByRole("button", { name: "Assign to me" }));
    await waitFor(() => expect(within(dialog()).getByLabelText("Assignee")).toHaveValue("u4"));

    await user.type(within(dialog()).getByLabelText("Add a comment…"), "Legal signed off");
    await user.click(within(dialog()).getByRole("button", { name: "Save" }));
    expect(await within(dialog()).findByText("Legal signed off")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens an issue from the URL", async () => {
    renderApp("/board?issue=LR-104");
    expect(await screen.findByRole("dialog")).toHaveTextContent("LR-104");
    expect(within(dialog()).getByLabelText("Summary")).toHaveValue("Payment button unresponsive on Safari 17");
  });

  it("deletes an issue from its detail dialog", async () => {
    const user = userEvent.setup();
    renderApp("/board?issue=LR-103");
    await screen.findByRole("dialog");
    await user.click(within(dialog()).getByRole("button", { name: "Delete issue" }));
    await waitFor(() => expect(screen.queryByText(/XSS safety/)).not.toBeInTheDocument());
  });

  it("filters with quick filters and clears them", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    await user.click(screen.getByRole("button", { name: "Only my issues" }));
    await waitFor(() => expect(screen.getByText("3 of 10 issues")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await user.click(screen.getByRole("button", { name: "Filter by Jordan Park" }));
    await waitFor(() => expect(screen.getByText("2 of 10 issues")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await user.selectOptions(screen.getByLabelText("Type"), "bug");
    await waitFor(() => expect(screen.getByText("2 of 10 issues")).toBeInTheDocument());
  });

  it("groups the board into swimlanes by assignee", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    await user.selectOptions(screen.getByLabelText("Group by"), "assignee");
    expect(screen.getByRole("button", { name: "Collapse Taylor Brooks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse Unassigned" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "To Do · Unassigned" })).getByText(/wrong version number/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse Unassigned" }));
    expect(screen.queryByText(/wrong version number/)).not.toBeInTheDocument();
  });

  it("switches to a sortable list view", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    await user.click(screen.getByRole("button", { name: "List" }));
    const table = screen.getByRole("table");
    const firstKey = () => within(within(table).getAllByRole("row")[1]).getByText(/^LR-/).textContent;
    expect(firstKey()).toBe("LR-101");

    await user.click(within(table).getByRole("button", { name: /Priority/ }));
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Highest");
    await user.click(within(table).getByRole("button", { name: /Priority/ }));
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Low");
  });

  it("queues changes offline, shows them as pending, and syncs on reconnect", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();

    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(await screen.findByText("Offline", { selector: ".statusChip" })).toBeInTheDocument();

    card("Draft and approve").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");

    const inProgress = column("In Progress");
    expect(within(inProgress).getByText(/Draft and approve/)).toBeInTheDocument();
    expect(within(inProgress).getByText("Pending sync")).toBeInTheDocument();
    expect(screen.getByText("Queued offline actions: 1")).toBeInTheDocument();
    expect(within(column("To Do")).getByRole("button", { name: "Create issue" })).toBeDisabled();

    onLine.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("online")));

    expect(await screen.findByText("All changes synced")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Pending sync")).not.toBeInTheDocument());
    expect(within(column("In Progress")).getByText(/Draft and approve/)).toBeInTheDocument();
  });

  it("opens the create dialog with the C shortcut", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitForBoard();
    await user.keyboard("c");
    expect(screen.getByRole("dialog", { name: "Create issue" })).toBeInTheDocument();
  });
});
