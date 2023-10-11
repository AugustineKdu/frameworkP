

const uri = "mongodb://localhost:27017";
const dbName = "mychatDB";  // 여기에 사용할 DB 이름 입력

const express = require('express');
const { MongoClient } = require('mongodb');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = 3000;


app.use(express.json());

const users = [
    { username: "user1", password: "hashed_password1", email: "user1@example.com", isAdmin: false, isSuperAdmin: false },
    { username: "admin1", password: "hashed_password2", email: "admin1@example.com", isAdmin: true, isSuperAdmin: false },
    { username: "superadmin1", password: "hashed_password3", email: "superadmin1@example.com", isAdmin: true, isSuperAdmin: true },
    { username: "user2", password: "hashed_password4", email: "user2@example.com", isAdmin: false, isSuperAdmin: false },
    { username: "user3", password: "hashed_password5", email: "user3@example.com", isAdmin: false, isSuperAdmin: false },
];

const chatGroups = [
    { name: "Group1", description: "Description for Group1", members: [] },
    { name: "Group2", description: "Description for Group2", members: [] },
    { name: "Group3", description: "Description for Group3", members: [] },
];


async function loadSampleData(db) {
    try {
        await db.collection('users').insertMany(users);
        await db.collection('chatGroups').insertMany(chatGroups);
        console.log("Sample data has been inserted into the database");
    } catch (err) {
        console.error("An error occurred while loading the sample data:", err);
    }
}

async function startServer() {
    try {
        const client = await MongoClient.connect(uri);
        console.log("Connected to the database");

        const db = client.db(dbName);

        // 샘플 데이터 로드
        await loadSampleData(db);

        const server = http.Server(app);
        const io = socketIO(server, {
            cors: {
                origin: "http://localhost:4200",
                methods: ["GET", "POST"]
            }
        });

        app.get('/', (req, res) => {
            res.send('Server is running!');
        });
        // Authentication
        app.post('/api/auth', async (req, res) => {
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username, password });
            if (user) {
                res.json({ valid: true, userId: user._id });
            } else {
                res.status(401).json({ valid: false });
            }
        });

        // Signup
        app.post('/api/signup', async (req, res) => {
            const { username, email, password } = req.body;
            try {
                const newUser = { username, email, password };
                await usersCollection.insertOne(newUser);
                res.json({ success: true });
            } catch (e) {
                console.error(e);
                res.status(500).json({ success: false });
            }
        });

        // Retrieve chat groups
        app.get('/api/chat-groups', async (req, res) => {
            try {
                const groups = await chatGroupsCollection.find({}).toArray();
                res.json(groups);
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: 'Failed to retrieve groups' });
            }
        });

        // Create a chat group
        app.post('/api/chat-groups', async (req, res) => {
            const { name, users } = req.body;
            try {
                const newGroup = { name, users, messages: [] };
                const result = await chatGroupsCollection.insertOne(newGroup);
                res.json({ success: true, groupId: result.insertedId });
            } catch (e) {
                console.error(e);
                res.status(500).json({ success: false });
            }
        });

        // Retrieve users
        app.get('/api/users', async (req, res) => {
            try {
                const users = await usersCollection.find({}).toArray();
                res.json(users);
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: 'Failed to retrieve users' });
            }
        });

        // Delete a chat group
        app.delete('/api/chat-groups/:id', async (req, res) => {
            try {
                const { id } = req.params;
                await chatGroupsCollection.deleteOne({ _id: ObjectId(id) });
                res.json({ success: true });
            } catch (e) {
                console.error(e);
                res.status(500).json({ success: false });
            }
        });

        // Add a user to a chat group
        app.put('/api/chat-groups/:id/add-user', async (req, res) => {
            const { id } = req.params;
            const { userId } = req.body;
            try {
                await chatGroupsCollection.updateOne(
                    { _id: ObjectId(id) },
                    { $addToSet: { users: ObjectId(userId) } }
                );
                res.json({ success: true });
            } catch (e) {
                console.error(e);
                res.status(500).json({ success: false });
            }
        });

        // Remove a user from a chat group
        app.put('/api/chat-groups/:id/remove-user', async (req, res) => {
            const { id } = req.params;
            const { userId } = req.body;
            try {
                await chatGroupsCollection.updateOne(
                    { _id: ObjectId(id) },
                    { $pull: { users: ObjectId(userId) } }
                );
                res.json({ success: true });
            } catch (e) {
                console.error(e);
                res.status(500).json({ success: false });
            }
        });

        // Send a message to a chat group
        app.post('/api/chat-groups/:id/send-message', async (req, res) => {
            const { id } = req.params;
            const { userId, text } = req.body;
            try {
                const newMessage = { userId: ObjectId(userId), text };
                await chatGroupsCollection.updateOne(
                    { _id: ObjectId(id) },
                    { $push: { messages: newMessage } }
                );
                res.json({ success: true });
            } catch (e) {
                console.error(e);
                res.status(500).json({ success: false });
            }
        });
        server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
        io.on('connection', (socket) => {
            console.log('a user connected');

            socket.on('message', async ({ groupId, message }) => {
                // Save message to database
                await chatGroupsCollection.updateOne(
                    { _id: ObjectId(groupId) },
                    { $push: { messages: message } }
                );

                // Broadcast message to all connected sockets
                io.emit('message', { groupId, message });
            });

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });

    } catch (e) {
        console.error(e);
    }
}

startServer();
