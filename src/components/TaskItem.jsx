import { useState } from "react";

export default function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDesc, setDraftDesc] = useState(task.description ?? "");
  const [busy, setBusy] = useState(false);

  const isDone = task.status === "done";

  const handleToggle = async () => {
    setBusy(true);
    try {
      await onToggle(task);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onUpdate(task.id, {
        title: draftTitle.trim(),
        description: draftDesc.trim() || null,
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(task.id);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <li className="task-item task-item--editing">
        <form onSubmit={handleSave} className="task-item-edit-form" aria-label="edit task">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            aria-label="edit task title"
            maxLength={200}
            autoFocus
          />
          <input
            type="text"
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            aria-label="edit task description"
            placeholder="description"
            maxLength={5000}
          />
          <button type="submit" disabled={busy || !draftTitle.trim()}>
            save
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={busy}>
            cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item${isDone ? " task-item--done" : ""}`}>
      <label className="task-check" aria-label={isDone ? "mark incomplete" : "mark complete"}>
        <input
          type="checkbox"
          checked={isDone}
          onChange={handleToggle}
          disabled={busy}
          aria-label={`task: ${task.title}`}
        />
        <span className="task-check-box" />
      </label>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          <span className={`status status--${task.status}`}>{task.status.replace("_", " ")}</span>
          <span className="task-id" title={task.id}>
            #{task.id.slice(0, 8)}
          </span>
        </div>
      </div>

      <div className="task-actions">
        <button type="button" onClick={() => setEditing(true)} disabled={busy} aria-label="edit task">
          edit
        </button>
        <button type="button" onClick={handleDelete} disabled={busy} aria-label="delete task" className="danger">
          delete
        </button>
      </div>
    </li>
  );
}
