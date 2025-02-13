const express = require("express");
const http = require("http");
const path = require("path");
// const ngrok = require('@ngrok/ngrok');
// const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } })

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

let users = {}; // Store connected users

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (room) => {
        socket.join(room);
        users[socket.id] = room;
        console.log(`User ${socket.id} joined room: ${room}`);

        const otherUser = Object.keys(users).find(id => users[id] === room && id !== socket.id);
        if (otherUser) {
            io.to(otherUser).emit("user-connected", socket.id);
        }
    });

    // socket.on("call", (room) => {
    //     socket.to(room).emit("incoming-call");
    // });

    // socket.on("accept-call", (room) => {
    //     socket.to(room).emit("call-accepted");
    // });

    // socket.on("decline-call", (room) => {
    //     socket.to(room).emit("call-declined");
    // });

    socket.on("offer", (data) => {
        io.to(data.target).emit("offer", { offer: data.offer, from: socket.id });
    });

    socket.on("answer", (data) => {
        io.to(data.target).emit("answer", { answer: data.answer, from: socket.id });
    });

    socket.on("candidate", (data) => {
        io.to(data.target).emit("candidate", { candidate: data.candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Get your endpoint online
// ngrok.connect({ addr: 8080, authtoken_from_env: true })
// 	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
