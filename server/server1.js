const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);

  // LOG EVERY EVENT (DEBUG – VERY IMPORTANT)
  socket.onAny((event, ...args) => {
    console.log("📨 Event received:", event, args);
  });

  // LOAD DOCUMENT
  socket.on("get-document", (docId) => {
    console.log("📄 get-document:", docId);

    db.query(
      "SELECT content FROM documents WHERE id = ?",
      [docId],
      (err, result) => {
        if (err) {
          console.error("❌ Select Error:", err);
          return;
        }

        if (result.length === 0) {
          db.query(
            "INSERT INTO documents (id, content) VALUES (?, '')",
            [docId],
            (err) => {
              if (err) {
                console.error("❌ Insert Error:", err);
                return;
              }
              console.log("🆕 New document created");
              socket.emit("load-document", "");
            }
          );
        } else {
          socket.emit("load-document", result[0].content);
        }
      }
    );
  });

  // REAL-TIME CHANGES
  socket.on("send-changes", (content) => {
    socket.broadcast.emit("receive-changes", content);
  });

  // SAVE DOCUMENT (UPSERT)
  socket.on("save-document", ({ docId, content }) => {
    console.log("💾 SAVE EVENT:", docId, content.length);

    db.query(
      `INSERT INTO documents (id, content)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE content = ?`,
      [docId, content, content],
      (err) => {
        if (err) {
          console.error("❌ Save Error:", err);
        } else {
          console.log("✅ Document saved in DB");
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
  });
});

server.listen(5001, () => {
  console.log("🚀 Backend running on port 5001");
});
