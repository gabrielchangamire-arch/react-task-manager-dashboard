import TaskItem from "./TaskItem.jsx";

export default function TaskList({ tasks, onToggle, onDelete, onUpdate }) {
  if (tasks.length === 0) {
    return (
      <div className="empty" role="status">
        no tasks here yet.
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="task list">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate} />
      ))}
    </ul>
  );
}
