export function makeTask(overrides = {}) {
  const id = overrides.id ?? cryptoRandomId();
  const now = new Date().toISOString();
  return {
    id,
    title: overrides.title ?? `task-${id.slice(0, 4)}`,
    description: overrides.description ?? null,
    status: overrides.status ?? "pending",
    attachment_key: overrides.attachment_key ?? null,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
}

function cryptoRandomId() {
  // Simple deterministic-ish id, good enough for tests.
  return Math.random().toString(36).slice(2, 10) + "-" + Math.random().toString(36).slice(2, 10);
}
