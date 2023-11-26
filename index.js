const express = require('express');
const { createServer } = require('http');
const {join} = require('path');
const {Server} = require('socket.io');

let connectedUsers = [];
const app = express();
const server = createServer(app);
const io = new Server(server);


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    const clientID = socket.id;
    // console.log(clientID);
    // console.log('a user connected');
    const username = socket.handshake.headers.username;
    // Add connected user
    connectedUsers.push({ clientID, username });
    sendUserListToClients();

    // Print connected users
    console.log("Connected users: " + connectedUsers);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        connectedUsers = connectedUsers.filter((user) => user !== clientID);
        console.log("Connected users: " + connectedUsers);
    });

    socket.on('chat message', (msg) => {
        console.log(msg);
    })
    socket.on('chat message', (msg) => {
        io.emit("chat message", msg);
    })

    socket.on("getPlayerID", () => {
        io.to(clientID).emit("getPlayerID", clientID);
    })
})

server.listen(3000, '0.0.0.0', () => {
    console.log('server running at http://3.71.101.250:3000');
  });

function sendUserListToClients() {
    // Usernames als JSON
    const usernames = connectedUsers.map((user) => user.username);
    const usernamesJSON = JSON.stringify(usernames);

    io.emit("playersConnected", usernamesJSON);
}
  
