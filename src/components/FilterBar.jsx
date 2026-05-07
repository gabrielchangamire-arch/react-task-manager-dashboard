const FILTERS = [
  { key: "all", label: "all" },
  { key: "active", label: "active" },
  { key: "completed", label: "completed" },
];

export default function FilterBar({ value, onChange, counts }) {
  return (
    <nav className="filter-bar" aria-label="task filters">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`filter-btn${value === f.key ? " filter-btn--active" : ""}`}
          onClick={() => onChange(f.key)}
          aria-pressed={value === f.key}
        >
          {f.label}
          {counts && (
            <span className="filter-count" aria-label={`${counts[f.key]} items`}>
              {counts[f.key]}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
