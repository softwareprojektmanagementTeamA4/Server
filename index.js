const express = require('express');
const { createServer } = require('http');
const {join} = require('path');
const {Server} = require('socket.io');

let connectedUsers = {};
const app = express();
const server = createServer(app);
const io = new Server(server);
let hostID = null;
let cars_data;


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    const clientID = socket.id;
    io.to(clientID).emit("getPlayerID", clientID);
    // console.log(clientID);
    // console.log('a user connected');
    const username = socket.handshake.headers.username;
    // Add connected user
    
    //if connectedUsers is empty
    if (Object.keys(connectedUsers).length == 0) {
        hostID = clientID;
    }

    io.to(clientID).emit("getHostID", hostID);
    connectedUsers[clientID] = username;

    
    //console.log("connectedUsers: " + username);**
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

    socket.on("npc_car_data", (data) => {
       // console.log(data);
        io.emit("receive_npc_car_data", data);
    })

    socket.on("player_cars_data", (data) => {
        //console.log(data);
        cars_data = data;
        io.emit("receive_start_position", data);
    })

    socket.on("request_start_position", () => {
        io.emit("receive_start_position", cars_data);
    })
        

    // socket.on("getHostID", () => {
    //     io.to(clientID).emit();
    // })

    socket.on("player_data", (data) => {
        //console.log(data);
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

    io.emit('playersConnected', connectedUsers);
}

function sendPositionToClients(data, id) {
    io.emit('receive_data', data);
}
  
