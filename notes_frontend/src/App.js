import React from "react";
import "./App.css";
import NotesPage from "./pages/NotesPage";

// PUBLIC_INTERFACE
function App() {
  /** Root application shell with top navigation and the Notes page. */
  return (
    <div className="AppRoot">
      <header className="topNav">
        <div className="navInner">
          <div className="brand">
            <span className="brandMark" aria-hidden="true">
              N
            </span>
            <div className="brandText">
              <div className="brandTitle">Notes</div>
              <div className="brandSubtitle">Simple Notes Manager</div>
            </div>
          </div>

          <div className="navRight">
            <a
              className="navLink"
              href="https://react.dev"
              target="_blank"
              rel="noreferrer"
            >
              React
            </a>
            <a
              className="navLink"
              href="https://fastapi.tiangolo.com/"
              target="_blank"
              rel="noreferrer"
            >
              FastAPI
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <NotesPage />
      </main>

      <footer className="footer">
        <div className="footerInner">
          <span className="muted">
            Built with a light, modern style. Primary:{" "}
            <span className="colorSwatch" style={{ background: "#3b82f6" }} />{" "}
            Secondary:{" "}
            <span className="colorSwatch" style={{ background: "#64748b" }} />{" "}
            Success:{" "}
            <span className="colorSwatch" style={{ background: "#06b6d4" }} />{" "}
            Error:{" "}
            <span className="colorSwatch" style={{ background: "#EF4444" }} />
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
