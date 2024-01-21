const express = require("express");
const { createServer } = require("http");
const { join } = require("path");
const { Server } = require("socket.io");

let connectedUsers = {};
const app = express();
const server = createServer(app);
const io = new Server(server);
let hostID = null;
let order = [];
let cars_data;
let player_ready = {};
const MAX_PLAYERS = 3;

// Event fired every time a new client connects:
io.on("connection", (socket) => {
  // If there are already 3 players connected, disconnect the new player
  if (Object.keys(connectedUsers).length >= MAX_PLAYERS) {
    socket.disconnect(true);
    return;
  }

  // Send client his ID
  const clientID = socket.id;
  io.to(clientID).emit("getPlayerID", clientID);
  // Read username sent by the client
  
  // Add connected user:
  
  //if connectedUsers is empty make the first user the host
  if (Object.keys(connectedUsers).length == 0) {
    hostID = clientID;
  }
  
  // If the client is not the host, set his ready status to false
  if (clientID != hostID) {
    player_ready[clientID] = false;
  }
  
  // Send hostID back to client
  io.to(clientID).emit("getHostID", hostID);
  
  const username = socket.handshake.headers.username;
  connectedUsers[clientID] = username;
  // Send updated user list to all clients
  sendUserListToClients();


  // Print connected users
  console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));

  // When a user disconnects:
  socket.on("disconnect", () => {
    console.log("user disconnected");
    // Remove user from connectedUsers
    delete connectedUsers[clientID];
    delete player_ready[clientID];
    
    // If the disconnected user is the host, set the new host
    if (clientID == hostID) {
      hostID = null;
      for (let key in connectedUsers) {
        hostID = key;
        break;
      }
      io.to(hostID).emit("getHostID", hostID);
    }

    // Delete order
    order = order.filter((player) => player.id !== clientID);
    console.log("order: ", order);
    sendUserListToClients();
    console.log("connectedUsers: ", JSON.stringify(connectedUsers, null, 2));
  });

  // Client requests his ID
  socket.on("getPlayerID", () => {
    io.to(clientID).emit("getPlayerID", clientID);
  });

  // Client sends npc car data
  socket.on("npc_car_data", (data) => {
    io.emit("receive_npc_car_data", data);
  });

  // Update user list on client side when a user joins or leaves
  socket.on("updateUserList", () => {
    // delay
    setTimeout(() => {
      sendUserListToClients();
    }, 1000);
  });

  // Set hostID
  socket.on("im_host", () => {
    hostID = clientID;
  });

  // Client sends the start positions of the players
  socket.on("player_start_positions_data", (data) => {
    console.log(data);
    cars_data = data;
    io.emit("receive_start_position", data);
  });

  // Client requests the start positions of the players
  socket.on("request_start_position", () => {
    io.emit("receive_start_position", cars_data);
  });

  // Client sends his position
  socket.on("player_data", (data) => {
    let id = socket.id;
    let position = {};
    position[id] = data;
    determine_order(data, order);
    sendPositionToClients(position);
  });

  // Client sends his ready status
  socket.on("player_ready", (is_ready) => {
    player_ready[clientID] = is_ready;
    // Check if all players are ready
    console.log(player_ready);
    all_ready = false;
    for (let key in player_ready) {
      if (player_ready[key] == true || key == hostID) {
        all_ready = true;
      } else {
        all_ready = false;
        break;
      }
    }
    io.to(hostID).emit("all_players_ready", all_ready);
  });

  // Game start
  socket.on("game_start", () => {
    io.emit("start");
  });
});

// Server listens for incoming requests
server.listen(3000, "0.0.0.0", () => {
  console.log("server running at http://35.246.239.15:3000");
});

function sendUserListToClients() {
  // Usernames als JSON
    io.emit("playersConnected", connectedUsers);
}

// Send position to all clients
function sendPositionToClients(data, id) {
  io.emit("receive_data", data);
}

// Determine the order of the players and send it to all clients
function determine_order(data, order) {
  let index = order.findIndex((player) => player.id === data.id);
  if (index === -1) {
    order.push({
      id: data.id,
      position: data.position,
      current_lap: data.current_lap,
    });
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
