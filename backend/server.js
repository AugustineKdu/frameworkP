const express = require('express');
const { MongoClient } = require('mongodb');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = 3000;

// MongoDB URI
const uri = "mongodb+srv://myUser:myPassword@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let chatGroups = [];
let users = [];

async function startServer() {
    try {
        // MongoDB 연결
        await client.connect();
        console.log("Connected to the database");

        // 데이터베이스와 컬렉션 선택
        const db = client.db('YOUR_DB_NAME');
        const usersCollection = db.collection('users');
        const chatGroupsCollection = db.collection('chatGroups');

        // Express 서버 시작
        const server = http.Server(app);

        // Socket.io for real-time chat
        const io = socketIO(server, {
            cors: {
                origin: "http://localhost:4200",
                methods: ["GET", "POST"]
            }
        });

        // ... (나머지 기존 코드)

        // API 엔드포인트 및 Socket.IO 이벤트 처리 로직
        // (여기에 코드를 추가/수정하시면 됩니다.)
        // ... (다른 코드)

        // Authentication API
        app.post('/api/auth', async (req, res) => {
            const { username, password } = req.body;
            try {
                const user = await usersCollection.findOne({ username, password });
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
            } catch (error) {
                console.error(error);
                res.status(500).json({ valid: false });
            }
        });

        // Signup API
        app.post('/api/signup', async (req, res) => {
            const { username, email, password, role } = req.body;
            try {
                const newUser = { username, email, password, role, valid: true };
                await usersCollection.insertOne(newUser);
                res.json(newUser);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to signup' });
            }
        });

        // API to get all chat groups
        app.get('/api/chat-groups', async (req, res) => {
            try {
                const chatGroups = await chatGroupsCollection.find({}).toArray();
                res.json(chatGroups);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch chat groups' });
            }
        });

        // API to add a new chat group
        app.post('/api/chat-groups', async (req, res) => {
            const newGroup = {
                name: req.body.name,
                messages: [],
                usernames: req.body.usernames || []
            };

            try {
                const result = await chatGroupsCollection.insertOne(newGroup);
                newGroup._id = result.insertedId;
                res.json(newGroup);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to create chat group' });
            }
        });
        // API to get all users with their chat groups
        app.get('/api/users', async (req, res) => {
            try {
                const users = await usersCollection.find({}).toArray();
                const usersWithGroups = await Promise.all(users.map(async user => {
                    const groups = await chatGroupsCollection.find({ usernames: user.username }).toArray();
                    return {
                        ...user,
                        groups: groups.map(group => ({ id: group._id, name: group.name }))
                    };
                }));
                res.json(usersWithGroups);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to fetch users' });
            }
        });


        // API to delete a chat group
        app.delete('/api/chat-groups/:id', async (req, res) => {
            try {
                const result = await chatGroupsCollection.deleteOne({ _id: new MongoClient.ObjectId(req.params.id) });
                if (result.deletedCount === 1) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ success: false, error: 'Group not found' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: 'Failed to delete chat group' });
            }
        });


        // API to add a user to a chat group
        app.put('/api/chat-groups/:id/add-user', async (req, res) => {
            const { username } = req.body;
            try {
                const result = await chatGroupsCollection.updateOne(
                    { _id: new MongoClient.ObjectId(req.params.id) },
                    { $addToSet: { usernames: username } }
                );
                if (result.matchedCount === 1) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ success: false, error: 'Group not found' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: 'Failed to add user to chat group' });
            }
        });

        // API to remove a user from a chat group
        app.put('/api/chat-groups/:id/remove-user', async (req, res) => {
            const { username } = req.body;
            try {
                const result = await chatGroupsCollection.updateOne(
                    { _id: new MongoClient.ObjectId(req.params.id) },
                    { $pull: { usernames: username } }
                );
                if (result.matchedCount === 1) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ success: false, error: 'Group not found' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: 'Failed to remove user from chat group' });
            }
        });

        // ... (다른 API 엔드포인트 및 Socket.IO 이벤트 핸들러)

        io.on('connection', (socket) => {
            console.log('New user connected');

            socket.on('joinRoom', (roomId) => {
                socket.join(roomId);
            });

            socket.on('leaveRoom', (roomId) => {
                socket.leave(roomId);
            });

            socket.on('send message', async (data) => {
                const { message, roomId } = data;
                try {
                    const group = await chatGroupsCollection.findOne({ _id: new MongoClient.ObjectId(roomId) });
                    if (group) {
                        await chatGroupsCollection.updateOne(
                            { _id: new MongoClient.ObjectId(roomId) },
                            { $push: { messages: { content: message } } }
                        );
                        io.to(roomId).emit('new message', { roomId, message });
                    } else {
                        socket.emit('error', 'Group not found');
                    }
                } catch (error) {
                    console.error(error);
                    socket.emit('error', 'Failed to send message');
                }
            });
        });





        server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (e) {
        console.error(e);
    }
}

startServer();
