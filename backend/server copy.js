// Server.js Setting
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

// Initialize JSON files
const initialChatGroups = JSON.stringify([
    { id: 1, name: 'General', messages: [], usernames: ['user', 'group', 'super'] },
    { id: 2, name: 'Random', messages: [], usernames: ['user', 'group', 'super'] }
]);
fs.writeFileSync('chatGroups.json', initialChatGroups);

fs.writeFileSync('chatGroups.json', initialChatGroups);

fs.writeFileSync('users.json', JSON.stringify([
    { username: 'user', email: 'user@example.com', password: '123', role: 'user', valid: true },
    { username: 'group', email: 'groupadmin@example.com', password: '123', role: 'group-admin', valid: true },
    { username: 'super', email: 'superadmin@example.com', password: '123', role: 'super-admin', valid: true },
]));

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let chatGroups = [];
let users = [];

// Function to load data from JSON files
function loadDataFromFile() {
    try {
        chatGroups = JSON.parse(fs.readFileSync('chatGroups.json', 'utf-8'));
        users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
    } catch (error) {
        console.log("Could not load data from file:", error);
    }
}

// Function to save data to JSON files
function saveDataToFile() {
    fs.writeFileSync('chatGroups.json', JSON.stringify(chatGroups));
    fs.writeFileSync('users.json', JSON.stringify(users));
}


// Load data from files on server start
loadDataFromFile();

// Authentication API
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
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


// Signup API
app.post('/api/signup', (req, res) => {
    const { username, email, password, role } = req.body;
    const newUser = { username, email, password, role, valid: true };
    users.push(newUser);
    saveDataToFile();  // Save updated users to JSON file
    res.json(newUser);
});



// Load data from file on server start
loadDataFromFile();

// API to get all chat groups
app.get('/api/chat-groups', (req, res) => {
    res.json(chatGroups);
});

// API to add a new chat group
app.post('/api/chat-groups', (req, res) => {
    const newGroup = {
        id: chatGroups.length + 1,
        name: req.body.name,
        messages: [],
        usernames: req.body.usernames || []
    };
    chatGroups.push(newGroup);
    saveDataToFile();
    res.json(newGroup);
});

// API to get all users with their chat groups
app.get('/api/users', (req, res) => {
    const usersWithGroups = users.map(user => {
        const groups = chatGroups.filter(group => group.usernames.includes(user.username));
        return {
            ...user,
            groups: groups.map(group => ({ id: group.id, name: group.name }))
        };
    });
    res.json(usersWithGroups);
});

// API to delete a chat group
app.delete('/api/chat-groups/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = chatGroups.findIndex(group => group.id === id);
    if (index !== -1) {
        chatGroups.splice(index, 1);
        saveDataToFile();  // Save updated data to file
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
//control the data on super-admin-Dashboard
app.get('/api/users', (req, res) => {
    res.json(users);
});
// API to get all users with their chat groups
app.get('/api/users', (req, res) => {
    const usersWithGroups = users.map(user => {
        const groups = chatGroups.filter(group => group.usernames.includes(user.username));  // Change 'members' to 'usernames'
        return {
            ...user,
            groups: groups.map(group => ({ id: group.id, name: group.name }))
        };
    });
    res.json(usersWithGroups);
});
app.put('/api/users/:id/role', (req, res) => {
    const id = parseInt(req.params.id);
    const { newRole } = req.body;
    const user = users.find(u => u.id === id);
    if (user) {
        user.role = newRole;
        saveDataToFile();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});
app.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users.splice(index, 1);
        saveDataToFile();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});
// Change a user's role
app.put('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    const user = users.find(u => u.id === id);
    if (user) {
        user.role = role;
        saveDataToFile();  // Save updated users to JSON file
        res.json({ success: true, role });
    } else {
        res.status(404).json({ success: false });
    }
});

// API to add a user to a chat group
app.put('/api/chat-groups/:id/add-user', (req, res) => {
    const id = parseInt(req.params.id);
    const { username } = req.body;
    const group = chatGroups.find(group => group.id === id);
    if (group && !group.usernames.includes(username)) {
        group.usernames.push(username);
        saveDataToFile();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// API to remove a user from a chat group
app.put('/api/chat-groups/:id/remove-user', (req, res) => {
    const id = parseInt(req.params.id);
    const { username } = req.body;
    const group = chatGroups.find(group => group.id === id);
    if (group && group.usernames.includes(username)) {
        const index = group.usernames.indexOf(username);
        group.usernames.splice(index, 1);
        saveDataToFile();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});


saveDataToFile();

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const http = require('http');
// const socketIO = require('socket.io');
// const { MongoClient } = require('mongodb');

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(bodyParser.json());

// const mongoUrl = "mongodb://localhost:27017";
// const dbName = "mychatapp";
// let db;

// async function initializeDatabase() {
//     try {
//         const client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true });
//         db = client.db(dbName);
//         console.log("Connected to MongoDB");
//     } catch (err) {
//         console.error("Failed to connect to MongoDB", err);
//     }
// }

// initializeDatabase();

// app.post('/api/login', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const user = await db.collection('users').findOne({ username, password });
//         if (user) {
//             res.json({ valid: true, userId: user._id });
//         } else {
//             res.status(401).json({ valid: false });
//         }
//     } catch (err) {
//         res.status(500).json({ valid: false });
//     }
// });

// app.post('/api/signup', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const existingUser = await db.collection('users').findOne({ username });
//         if (existingUser) {
//             res.status(400).json({ error: 'Username already exists' });
//         } else {
//             const newUser = { username, password };
//             const result = await db.collection('users').insertOne(newUser);
//             res.json({ userId: result.insertedId });
//         }
//     } catch (err) {
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.get('/api/chat-groups', async (req, res) => {
//     try {
//         const chatGroups = await db.collection('chatGroups').find({}).toArray();
//         res.json(chatGroups);
//     } catch (err) {
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// const server = http.Server(app);
// const io = socketIO(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// io.on('connection', (socket) => {
//     console.log('New user connected');

//     socket.on('joinRoom', ({ userId, room }) => {
//         socket.join(room);
//         socket.to(room).broadcast.emit('message', { userId, text: `${userId} has joined the room.` });
//     });

//     socket.on('sendMessage', ({ userId, room, message }) => {
//         io.to(room).emit('message', { userId, text: message });
//         db.collection('messages').insertOne({ userId, room, text: message });
//     });

//     socket.on('leaveRoom', ({ userId, room }) => {
//         socket.leave(room);
//         socket.to(room).broadcast.emit('message', { userId, text: `${userId} has left the room.` });
//     });

//     socket.on('disconnect', () => {
//         console.log('User disconnected');
//     });
// });

// server.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });
