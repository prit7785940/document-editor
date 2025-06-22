require('dotenv').config();  
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const ACTIONS = require("./Actions");
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Mongoose Schema & Model
const CodeSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: { type: String, default: "" },
});
const Code = mongoose.model("Code", CodeSchema);

// Download Endpoint
app.get("/download/:roomId", async (req, res) => {
  try {
    const roomData = await Code.findOne({ roomId: req.params.roomId });
    if (!roomData) return res.status(404).send("Room not found");

    res.setHeader("Content-Disposition", "attachment; filename=code.txt");
    res.setHeader("Content-Type", "text/plain");
    res.send(roomData.code);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5000"],
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => ({
    socketId,
    username: userSocketMap[socketId],
  }));
};

io.on("connection", (socket) => {
  socket.on(ACTIONS.JOIN, async ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    try {
      let roomData = await Code.findOne({ roomId });
      if (!roomData) {
        roomData = await Code.create({ roomId, code: "" });
      }

      socket.emit(ACTIONS.CODE_CHANGE, { code: roomData.code });

      const clients = getAllConnectedClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username,
          socketId: socket.id,
        });
      });
    } catch (err) {
      console.error("Join error:", err);
    }
  });

  socket.on(ACTIONS.CODE_CHANGE, async ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    try {
      await Code.findOneAndUpdate({ roomId }, { code }, { upsert: true });
    } catch (err) {
      console.error("Save error:", err);
    }
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
