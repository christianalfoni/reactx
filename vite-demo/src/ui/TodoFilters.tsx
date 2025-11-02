import { Filter, TodoState } from "../state";

type TodoFiltersProps = {
  state: TodoState;
};

export function TodoFilters({ state }: TodoFiltersProps) {
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="filters">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          className={state.filter === value ? "active" : ""}
          onClick={() => state.setFilter(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
