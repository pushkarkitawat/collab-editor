import { useEffect, useState } from "react";
import { socket } from "./socket";
import "./App.css";

const DOC_ID = 1;

export default function Editor() {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // CONNECT + LOAD DOCUMENT
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      socket.emit("get-document", DOC_ID);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", () => setConnected(false));

    socket.on("load-document", (data) => {
      setContent(data);
      setLoaded(true);
    });

    socket.on("receive-changes", (data) => {
      setContent(data);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("load-document");
      socket.off("receive-changes");
    };
  }, []);

  // AUTO SAVE
  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(() => {
      socket.emit("save-document", {
        docId: DOC_ID,
        content
      });
      setLastSaved(new Date().toLocaleTimeString());
    }, 2000);

    return () => clearInterval(interval);
  }, [content, loaded]);

  // HANDLERS
  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);
    socket.emit("send-changes", value);
  };

  const handleClear = () => {
    if (window.confirm("Clear document?")) {
      setContent("");
      socket.emit("send-changes", "");
    }
  };

  const manualSave = () => {
    socket.emit("save-document", {
      docId: DOC_ID,
      content
    });
    setLastSaved(new Date().toLocaleTimeString());
  };

  const words = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;

  return (
    <div className="editor-wrapper">
      {/* HEADER */}
      <header className="editor-header">
        <h3>📄 Collaborative Document</h3>
        <span className={connected ? "online" : "offline"}>
          {connected ? "🟢 Online" : "🔴 Offline"}
        </span>
      </header>

      {/* TOOLBAR */}
      <div className="toolbar">
        <button onClick={manualSave}>💾 Save Now</button>
        <button onClick={handleClear}>🧹 Clear</button>
        <span className="stats">
          Words: {words} | Characters: {content.length}
        </span>
      </div>

      {/* EDITOR */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Start typing collaboratively..."
        disabled={!loaded}
      />

      {/* FOOTER */}
      <footer className="editor-footer">
        {lastSaved && <span>Last saved at {lastSaved}</span>}
      </footer>
    </div>
  );
}
