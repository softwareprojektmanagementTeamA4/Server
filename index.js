const express = require('express');
const { createServer } = require('http');
const {join} = require('path');
const {Server} = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);
let connectedUsers = {};
let order = [];
let cars_data;
let hostID = null;

/////////////////////////?????????????????????????????????????//////////////////////////////////
// app.get('/', (req, res) => {
//   res.sendFile(join(__dirname, 'index.html'));
// });
//////////////////????????????????????????????????????//////////////////////////////////////////


io.on('connection', (socket) => {
    const clientID = socket.id;
    const username = socket.handshake.headers.username;

    // Checks if there are no connected users, if so, the first user to connect is the host of the game
    if (Object.keys(connectedUsers).length == 0) {
        hostID = clientID;
    }
    
    // Every user who connects to the server gets their own ID and the ID of the host
    io.to(clientID).emit("getPlayerID", clientID);
    io.to(clientID).emit("getHostID", hostID);

    connectedUsers[clientID] = username;

    // Send the list of connected users to all clients (this is mainly used for showing the list of connected users in the lobby)
    sendUserListToClients();

    // Shows all connected users in the console of the server
    console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));


    socket.on('disconnect', () => {
        delete connectedUsers[clientID];
        sendUserListToClients();
        console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));
    });

    socket.on("getPlayerID", () => {
        io.to(clientID).emit("getPlayerID", clientID);
    })

    socket.on("npc_car_data", (data) => {
       // console.log(data);
        io.emit("receive_npc_car_data", data);
    })

    socket.on("player_start_positions_data", (data) => {
        //console.log(data);
        cars_data = data;
        io.emit("receive_start_position", data);
    })

    socket.on("request_start_position", () => {
        io.emit("receive_start_position", cars_data);
    })

    socket.on("player_data", (data) => {
        let id = socket.id;
        let position = {};
        position[id] = data;
        determine_order(data, order);
        sendPositionToClients(position);
    }
    )
});


server.listen(3000, '0.0.0.0', () => {
    console.log('server running at http://35.246.239.15:3000');
  });


function sendUserListToClients() {
    io.emit('playersConnected', connectedUsers);
}


function sendPositionToClients(data) {
    io.emit('receive_data', data);
}


function determine_order(data, order) {

    // Checks if 
    let index = order.findIndex(player => player.id === data.id);
    if (index === -1) {
        order.push({ id: data.id, position: data.position, current_lap: data.current_lap });
    } else {
        order[index].position = data.position;
        order[index].current_lap = data.current_lap;
    }


    order.sort((a, b) => {
        if (a.current_lap === b.current_lap) {
            return a.position - b.position;
        }
        return a.current_lap - b.current_lap;
    });

    io.emit("receive_order", order);
}


