const express = require('express');
const { createServer } = require('http');
const {join} = require('path');
const {Server} = require('socket.io');

let connectedUsers = {};
const app = express();
const server = createServer(app);
const io = new Server(server);
let host;


//app.get('/', (req, res) => {
  //res.sendFile(join(__dirname, 'index.html'));
//});

io.on('connection', (socket) => {
    const clientID = socket.id;
    // console.log(clientID);
    // console.log('a user connected');
    const username = socket.handshake.headers.username;
    // Add connected user
    connectedUsers[clientID] = username;
    // 
    if (Object.keys(connectedUsers).length == 1) {
        host = clientID;

    }
    console.log("host: ", host);
    console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));
    sendUserListToClients();


    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete connectedUsers[clientID];
        console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));
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
    console.log('server running');
  });

function sendUserListToClients() {
    // Usernames als JSON
    const usernames = Object.values(connectedUsers);

    io.emit('playersConnected', { usernames });
}
  
