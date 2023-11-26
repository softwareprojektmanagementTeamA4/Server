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

    // Add connected user
    connectedUsers.push(clientID);

    // Print connected users
    console.log("Connected users: " + connectedUsers);

    socket.on('disconnect', () => {
	const clientID = socket.handshake.address;
	console.log("Disconnect", clientID);
        console.log('user disconnected');
      });
    socket.on('chat message', (msg) => {
        console.log(msg);
    })
    socket.on('chat message', (msg) => {
        io.emit("chat message", msg);
    })
   
})

server.listen(3000, '0.0.0.0', () => {
    console.log('server running at http://3.71.101.250:3000');
  });
  
