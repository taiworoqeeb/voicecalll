const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    users[socket.id] = room;
    console.log(`User ${socket.id} joined room: ${room}`);

    const otherUser = Object.keys(users).find(
      (id) => users[id] === room && id !== socket.id,
    );
    if (otherUser) {
      io.to(otherUser).emit("user-connected", socket.id);
    }
  });

  socket.on("offer", (data) => {
    io.to(data.target).emit("offer", { offer: data.offer, from: socket.id });
  });

  socket.on("answer", (data) => {
    io.to(data.target).emit("answer", { answer: data.answer, from: socket.id });
  });

  socket.on("candidate", (data) => {
    io.to(data.target).emit("candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("end-call", () => {
    const room = users[socket.id];
    if (room) {
      io.to(room).emit("call-ended"); // Notify all users in the room
      console.log(`Call ended in room: ${room}`);
      Object.keys(users).forEach((id) => {
        if (users[id] === room) {
          delete users[id];
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const room = users[socket.id];
    delete users[socket.id];
    socket.to(room).emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
