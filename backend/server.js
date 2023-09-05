const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());


const users = [
    { username: 'user', email: 'user', password: '123', role: 'user', valid: true },
    { username: 'group', email: 'groupadmin@example.com', password: '123', role: 'group-admin', valid: true },
    { username: 'super', email: 'superadmin@example.com', password: '123', role: 'super-admin', valid: true },
];

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


const server = http.Server(app);
const io = require('socket.io')(httpServer, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('send message', (data) => {
        io.emit('new message', data);
    });
});


server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
