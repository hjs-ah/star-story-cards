const API = "/api/notion";

async function call(action, body = null) {
  const res = await fetch(`${API}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const listStories  = () => call("list");
export const getSchema    = () => call("schema");
export const createStory  = (story) => call("create", story);
export const updateStory  = (id, story) => call("update", { id, ...story });
export const patchStory   = (id, fields) => call("update", { id, ...fields });

export async function fetchConfig() {
  const res = await fetch("/api/config");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Config fetch failed");
  return data;
}

export async function saveCA2R(id, car) {
  return call("update", {
    id,
    car2r_context:   car.context    || "",
    car2r_approach1: car.approach1  || "",
    car2r_approach2: car.approach2  || "",
    car2r_result:    car.result     || "",
    car2r_coach:     car.coachNotes || "",
    car2r_generated: true,
  });
}
