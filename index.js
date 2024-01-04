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

    socket.on("player_start_positions_data", (data) => {
        //console.log(data);
        cars_data = data;
        io.emit("receive_start_position", data);
    })

    socket.on("request_start_position", () => {
        io.emit("receive_start_position", cars_data);
    })

    socket.on("request_order", () => {
        io.emit("receive_order", order);
    })
        

    // socket.on("getHostID", () => {
    //     io.to(clientID).emit();
    // })

    socket.on("player_data", (data) => {

        // sio.emit('player_data', {'client_id: id, 'username': username,'playerX': playerX, 'position': position, 'player_num': player_num, 'speed': speed, 'nitro': nitro_is_on, 'current_lap': current_lap})
        let id = socket.id;
        let position = {};
        // determine_order(data);
        position[id] = data;
        sendPositionToClients(position);

        
    // Update the order array
    let index = order.findIndex(player => player.id === data.id);
    if (index === -1) {
        order.push({ id: data.client_id, position: data.position, current_lap: data.current_lap });
    } else {
        order[index].position = data.position;
        order[index].current_lap = data.current_lap;
    }

    // Sort the order array
    order.sort((a, b) => {
        if (a.current_lap === b.current_lap) {
            return a.position - b.position;
        }
        return a.current_lap - b.current_lap;
    });

    // Emit the updated order array to all clients
    io.emit("receive_order", order);
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

// function determine_order(data) {
//     let index = order.findIndex(player => player.id === data.id);
//     if (index === -1) {
//         order.push({ id: data.client_id, position: data.position, current_lap: data.current_lap });
//     } else {
//         order[index].position = data.position;
//         order[index].current_lap = data.current_lap;
//     }

//     order.sort((a, b) => {
//         if (a.current_lap === b.current_lap) {
//             return a.position - b.position;
//         }
//         return a.current_lap - b.current_lap;
//     });

//     io.emit("receive_order", order);
// }



