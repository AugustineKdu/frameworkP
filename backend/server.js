// ------------------------- Server Part -------------------------

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// User authentication data
const users = [
    { username: 'user', email: 'user@example.com', password: '123', role: 'user', valid: true },
    { username: 'group', email: 'groupadmin@example.com', password: '123', role: 'group-admin', valid: true },
    { username: 'super', email: 'superadmin@example.com', password: '123', role: 'super-admin', valid: true },
];

// Authentication API
app.post('/api/auth', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({
            valid: true,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(401).json({ valid: false });
    }
});

// ------------------------- Chat Part -------------------------

// Chat group data
let chatGroups = [
    { id: 1, name: 'Group 1', messages: [] },
    { id: 2, name: 'Group 2', messages: [] }
];

// API to get all chat groups
app.get('/api/chat-groups', (req, res) => {
    res.json(chatGroups);
});

// API to add a new chat group
app.post('/api/chat-groups', (req, res) => {
    const newGroup = {
        id: chatGroups.length + 1,
        name: req.body.name,
        messages: []
    };
    chatGroups.push(newGroup);
    res.json(newGroup);
});

// API to delete a chat group
app.delete('/api/chat-groups/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = chatGroups.findIndex(group => group.id === id);
    if (index !== -1) {
        chatGroups.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});
const server = http.Server(app);

// Socket.io for real-time chat
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
    });

    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
    });

    socket.on('send message', (data) => {
        const { message, roomId } = data;
        const group = chatGroups.find(group => group.id === parseInt(roomId));
        if (group) {
            group.messages.push({ content: message });
            io.to(roomId).emit('new message', { roomId, message });
        } else {
            // Emit an error if the group is not found
            socket.emit('error', 'Group not found');
        }
    });
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
