import { useState } from "react";

export default function TaskForm({ onCreate, disabled = false }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!title.trim()) {
      setLocalError("title is required");
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({ title: title.trim(), description: description.trim() || null });
      setTitle("");
      setDescription("");
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit} aria-label="create task">
      <div className="task-form-row">
        <input
          type="text"
          placeholder="task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="task title"
          disabled={disabled || submitting}
          maxLength={200}
        />
        <input
          type="text"
          placeholder="description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="task description"
          disabled={disabled || submitting}
          maxLength={5000}
        />
        <button type="submit" disabled={disabled || submitting}>
          {submitting ? "adding..." : "add task"}
        </button>
      </div>
      {localError && (
        <div className="task-form-error" role="alert">
          {localError}
        </div>
      )}
    </form>
  );
}
