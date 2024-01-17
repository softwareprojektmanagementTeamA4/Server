const express = require('express');
const { createServer } = require('http');
const {join} = require('path');
const {Server} = require('socket.io');

let connectedUsers = {};
const app = express();
const server = createServer(app);
const io = new Server(server);
let hostID = null;
let order = [];
let cars_data;
let player_ready = {};


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

    if (clientID != hostID) {
        player_ready[clientID] = false;
    }

    io.to(clientID).emit("getHostID", hostID);
    connectedUsers[clientID] = username;

    

    
    sendUserListToClients();

    // Print connected users
    console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));

    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete connectedUsers[clientID];
        delete player_ready[clientID];
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

    socket.on("im_host", () => {
        hostID = clientID;}
        );

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
        console.log("test");
    }
    )

    socket.on("player_ready", (is_ready) => {
        player_ready[clientID] = is_ready;
        // Check if all players are ready
        console.log(player_ready);
        all_ready = false;
        for (let key in player_ready) {
            if (player_ready[key] == true) {
                all_ready = true;
            } else {
                all_ready = false;
                break;
            }
        }
        io.to(hostID).emit("all_players_ready", all_ready);

    })

    socket.on("game_start", () => {
        io.emit("start");
    })


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

function determine_order(data, order) {
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


