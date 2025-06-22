const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // frontend ka origin yahan dena ho to replace "*"
    methods: ["GET", "POST"],
  },
});

const documents = {}; // Memory me temporary document store

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("get-document", (docId) => {
    if (!documents[docId]) {
      documents[docId] = "";
    }
    socket.join(docId);
    socket.emit("load-document", documents[docId]);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(docId).emit("receive-changes", delta);
    });

    socket.on("save-document", (data) => {
      documents[docId] = data;
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
