import { useCallback, useEffect, useMemo, useState } from "react";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";
import FilterBar from "./components/FilterBar.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import { tasksApi } from "./services/api.js";

const FILTER_FNS = {
  all: () => true,
  active: (t) => t.status !== "done",
  completed: (t) => t.status === "done",
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (payload) => {
    const created = await tasksApi.create(payload);
    setTasks((prev) => [created, ...prev]);
  };

  const handleToggle = async (task) => {
    const next = task.status === "done" ? "pending" : "done";
    try {
      const updated = await tasksApi.update(task.id, { status: next });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      const updated = await tasksApi.update(id, patch);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tasksApi.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter(FILTER_FNS.active).length,
      completed: tasks.filter(FILTER_FNS.completed).length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => tasks.filter(FILTER_FNS[filter]), [tasks, filter]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Task Manager</h1>
          <p className="app-subtitle">React + AWS Task Manager API</p>
        </div>
        <button type="button" className="ghost" onClick={refresh} disabled={loading} aria-label="refresh">
          {loading ? "..." : "refresh"}
        </button>
      </header>

      <main className="app-main">
        <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={refresh} />

        <TaskForm onCreate={handleCreate} disabled={loading && tasks.length === 0} />

        <FilterBar value={filter} onChange={setFilter} counts={counts} />

        {loading && tasks.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <TaskList
            tasks={visibleTasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>backend: {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}</span>
      </footer>
    </div>
  );
}
