import React, { useEffect, useMemo, useState } from "react";

// PUBLIC_INTERFACE
export default function NoteForm({
  mode,
  initialValue,
  onCancel,
  onSubmit,
  busy = false,
  error = null,
}) {
  /** Form for creating/editing notes (title, content). */

  const initial = useMemo(() => {
    return {
      title: initialValue?.title ?? "",
      content: initialValue?.content ?? "",
    };
  }, [initialValue]);

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [touched, setTouched] = useState({ title: false, content: false });

  useEffect(() => {
    setTitle(initial.title);
    setContent(initial.content);
    setTouched({ title: false, content: false });
  }, [initial.title, initial.content]);

  const titleError =
    touched.title && title.trim().length === 0 ? "Title is required." : null;

  const contentError =
    touched.content && content.trim().length === 0
      ? "Content is required."
      : null;

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const submitLabel = mode === "edit" ? "Save changes" : "Add note";
  const heading = mode === "edit" ? "Edit note" : "New note";

  return (
    <section className="card" aria-label={heading}>
      <div className="cardHeader">
        <div>
          <h2 className="h2">{heading}</h2>
          <p className="muted">
            {mode === "edit"
              ? "Update the note and save your changes."
              : "Create a new note to keep track of your thoughts."}
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alertError" role="alert">
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ title: true, content: true });
          if (!canSubmit || busy) return;
          onSubmit({ title: title.trim(), content: content.trim() });
        }}
      >
        <div className="formGrid">
          <label className="field">
            <span className="label">Title</span>
            <input
              className={`input ${titleError ? "inputError" : ""}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, title: true }))}
              placeholder="e.g. Shopping list"
              disabled={busy}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? "title-error" : undefined}
            />
            {titleError ? (
              <span className="fieldError" id="title-error">
                {titleError}
              </span>
            ) : null}
          </label>

          <label className="field fieldSpan2">
            <span className="label">Content</span>
            <textarea
              className={`textarea ${contentError ? "inputError" : ""}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, content: true }))}
              placeholder="Write your note here..."
              rows={7}
              disabled={busy}
              aria-invalid={Boolean(contentError)}
              aria-describedby={contentError ? "content-error" : undefined}
            />
            {contentError ? (
              <span className="fieldError" id="content-error">
                {contentError}
              </span>
            ) : null}
          </label>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btnSecondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btnPrimary"
            disabled={!canSubmit || busy}
          >
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
