const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * Attempt to parse JSON safely; some error responses may be plain text.
 */
async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Create a consistent Error object from a failed fetch response.
 */
async function toHttpError(response) {
  const data = await safeParseJson(response);
  const message =
    (data && (data.detail || data.message)) ||
    `Request failed (${response.status} ${response.statusText})`;
  const err = new Error(message);
  err.status = response.status;
  err.data = data;
  return err;
}

/**
 * Low-level request helper.
 */
async function request(path, options = {}, baseUrl = DEFAULT_BASE_URL) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw await toHttpError(res);
  }

  // Many FastAPI endpoints return JSON; if not, return null.
  return await safeParseJson(res);
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns configured API base URL. Uses REACT_APP_API_BASE_URL if provided. */
  return process.env.REACT_APP_API_BASE_URL || DEFAULT_BASE_URL;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes. */
  const baseUrl = getApiBaseUrl();
  return await request("/notes", { method: "GET" }, baseUrl);
}

// PUBLIC_INTERFACE
export async function createNote(note) {
  /** Create a note with {title, content}. */
  const baseUrl = getApiBaseUrl();
  return await request(
    "/notes",
    { method: "POST", body: JSON.stringify(note) },
    baseUrl
  );
}

// PUBLIC_INTERFACE
export async function updateNote(id, note) {
  /** Update a note by id with {title, content}. */
  const baseUrl = getApiBaseUrl();
  return await request(
    `/notes/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(note) },
    baseUrl
  );
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. */
  const baseUrl = getApiBaseUrl();
  return await request(
    `/notes/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    baseUrl
  );
}
