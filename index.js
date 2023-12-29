const express = require('express');
const { createServer } = require('http');
const {join} = require('path');
const {Server} = require('socket.io');

let connectedUsers = {};
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
    connectedUsers[clientID] = username;
    //console.log("connectedUsers: " + username);
    sendUserListToClients();

    // Print connected users
    console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));

    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete connectedUsers[clientID];
        console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));
    });

    socket.on("getPlayerID", () => {
        io.to(clientID).emit("getPlayerID", clientID);
    })

    socket.on("player_data", (data) => {
        console.log(data);
        let id = socket.id;
        let position = {};
        position[id] = data;
        sendPositionToClients(position);
    }
    )
});
server.listen(3000, '0.0.0.0', () => {
    console.log('server running at http://35.246.239.15:3000');
  });

function sendUserListToClients() {
    // Usernames als JSON
    const usernames = Object.values(connectedUsers);

    io.emit('playersConnected', { usernames });
}

function sendPositionToClients(data, id) {
    io.emit('receive_data', data);
}
  
