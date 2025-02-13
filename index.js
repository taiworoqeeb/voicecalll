const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

let users = {}; // Store connected users and their rooms

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (room) => {
        socket.join(room);
        users[socket.id] = room;
        console.log(`User ${socket.id} joined room: ${room}`);

        // Notify other users in the room
        const otherUser = Object.keys(users).find(id => users[id] === room && id !== socket.id);
        if (otherUser) {
            io.to(otherUser).emit("user-connected", socket.id);
        }
    });

    socket.on("offer", (data) => {
        if (users[data.target]) {
            io.to(data.target).emit("offer", { offer: data.offer, from: socket.id });
        }
    });

    socket.on("answer", (data) => {
        if (users[data.target]) {
            io.to(data.target).emit("answer", { answer: data.answer, from: socket.id });
        }
    });

    socket.on("candidate", (data) => {
        if (users[data.target]) {
            io.to(data.target).emit("candidate", { candidate: data.candidate, from: socket.id });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        const room = users[socket.id];
        delete users[socket.id];

        // Notify the other user in the room
        if (room) {
            const otherUser = Object.keys(users).find(id => users[id] === room);
            if (otherUser) {
                io.to(otherUser).emit("user-disconnected", socket.id);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
