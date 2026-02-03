import React, { useEffect, useMemo, useState } from "react";
import NoteForm from "../components/NoteForm";
import { createNote, deleteNote, listNotes, updateNote } from "../api/notesApi";

function normalizeNote(raw) {
  // Backend might return {id, title, content} or similar.
  return {
    id: raw.id,
    title: raw.title ?? "",
    content: raw.content ?? "",
  };
}

function sortNotesDesc(a, b) {
  // Prefer newest-first by numeric-ish id; fallback to string.
  const ai = Number(a.id);
  const bi = Number(b.id);
  if (!Number.isNaN(ai) && !Number.isNaN(bi)) return bi - ai;
  return String(b.id).localeCompare(String(a.id));
}

// PUBLIC_INTERFACE
export default function NotesPage() {
  /** Main Notes CRUD page: list, add, edit, delete notes. */

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const [pendingDeletes, setPendingDeletes] = useState(() => new Set());

  const editingNote = useMemo(() => {
    if (formMode !== "edit") return null;
    return notes.find((n) => n.id === editingId) || null;
  }, [editingId, formMode, notes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPageError(null);
      try {
        const data = await listNotes();
        if (cancelled) return;
        const normalized = Array.isArray(data) ? data.map(normalizeNote) : [];
        setNotes(normalized.sort(sortNotesDesc));
      } catch (e) {
        if (cancelled) return;
        setPageError(e?.message || "Failed to load notes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormError(null);
  };

  const startEdit = (id) => {
    setFormMode("edit");
    setEditingId(id);
    setFormError(null);
    // Scroll to form for mobile comfort
    window.requestAnimationFrame(() => {
      const el = document.getElementById("note-form-anchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const cancelForm = () => {
    startCreate();
  };

  const handleCreate = async (payload) => {
    setFormBusy(true);
    setFormError(null);

    // Optimistic add with a temporary id.
    const tempId = `tmp_${Date.now()}`;
    const optimistic = { id: tempId, ...payload, _optimistic: true };
    setNotes((prev) => [optimistic, ...prev]);

    try {
      const created = await createNote(payload);
      const normalized = normalizeNote(created);

      setNotes((prev) =>
        prev
          .map((n) => (n.id === tempId ? normalized : n))
          .sort(sortNotesDesc)
      );
      startCreate();
    } catch (e) {
      // Rollback optimistic note.
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setFormError(e?.message || "Failed to create note.");
    } finally {
      setFormBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingId) return;
    setFormBusy(true);
    setFormError(null);

    // Optimistic update: apply immediately, keep snapshot for rollback.
    const prevSnapshot = notes;
    setNotes((prev) =>
      prev
        .map((n) => (n.id === editingId ? { ...n, ...payload } : n))
        .sort(sortNotesDesc)
    );

    try {
      const updated = await updateNote(editingId, payload);
      const normalized = normalizeNote(updated);
      setNotes((prev) =>
        prev
          .map((n) => (n.id === editingId ? normalized : n))
          .sort(sortNotesDesc)
      );
      startCreate();
    } catch (e) {
      setNotes(prevSnapshot);
      setFormError(e?.message || "Failed to update note.");
    } finally {
      setFormBusy(false);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic delete: remove immediately, rollback on failure.
    const prevSnapshot = notes;
    setPageError(null);

    setPendingDeletes((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setNotes((prev) => prev.filter((n) => n.id !== id));

    // If deleting the note being edited, reset form.
    if (formMode === "edit" && editingId === id) startCreate();

    try {
      await deleteNote(id);
    } catch (e) {
      setNotes(prevSnapshot);
      setPageError(e?.message || "Failed to delete note.");
    } finally {
      setPendingDeletes((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="page">
      <div className="contentGrid">
        <div className="leftCol">
          <div className="toolbar card">
            <div>
              <h1 className="h1">Notes</h1>
              <p className="muted">
                Create, edit, and manage your notes. Changes are saved to the
                backend API.
              </p>
            </div>

            <div className="toolbarActions">
              <button className="btn btnPrimary" onClick={startCreate}>
                + New note
              </button>
            </div>
          </div>

          {pageError ? (
            <div className="alert alertError" role="alert">
              <strong>Error:</strong> {pageError}
            </div>
          ) : null}

          <section className="card" aria-label="Notes list">
            <div className="cardHeader">
              <h2 className="h2">Your notes</h2>
              <span className="badge">
                {loading ? "…" : `${notes.length} item${notes.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {loading ? (
              <div className="skeletonList" aria-label="Loading notes">
                <div className="skeletonRow" />
                <div className="skeletonRow" />
                <div className="skeletonRow" />
              </div>
            ) : notes.length === 0 ? (
              <div className="emptyState">
                <p className="emptyTitle">No notes yet</p>
                <p className="muted">
                  Create your first note using the form on the right.
                </p>
              </div>
            ) : (
              <ul className="notesList">
                {notes.map((n) => {
                  const isDeleting = pendingDeletes.has(n.id);
                  const isEditing = formMode === "edit" && editingId === n.id;

                  return (
                    <li key={n.id} className={`noteItem ${isEditing ? "noteItemActive" : ""}`}>
                      <div className="noteBody">
                        <div className="noteTitleRow">
                          <h3 className="noteTitle">
                            {n.title}
                            {n._optimistic ? (
                              <span className="badge badgeInfo">Saving…</span>
                            ) : null}
                          </h3>
                        </div>
                        <p className="noteContent">{n.content}</p>
                      </div>

                      <div className="noteActions">
                        <button
                          className="btn btnSmall btnSecondary"
                          onClick={() => startEdit(n.id)}
                          disabled={isDeleting}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btnSmall btnDanger"
                          onClick={() => handleDelete(n.id)}
                          disabled={isDeleting || String(n.id).startsWith("tmp_")}
                          aria-label={`Delete note ${n.title}`}
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="rightCol">
          <div id="note-form-anchor" />
          <NoteForm
            mode={formMode}
            initialValue={formMode === "edit" ? editingNote : null}
            onCancel={cancelForm}
            onSubmit={formMode === "edit" ? handleUpdate : handleCreate}
            busy={formBusy}
            error={formError}
          />

          <div className="card infoCard" aria-label="API info">
            <h2 className="h2">API</h2>
            <p className="muted">
              This UI talks to the backend at{" "}
              <code className="codeInline">
                {process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}
              </code>
              .
            </p>
            <p className="muted">
              Tip: set <code className="codeInline">REACT_APP_API_BASE_URL</code>{" "}
              to point to a different environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
