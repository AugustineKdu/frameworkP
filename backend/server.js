const express = require('express');
const { MongoClient } = require('mongodb');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const port = 3000;

const uri = "mongodb://localhost:27017";
const dbName = "mychatDB";

app.use(express.json());

const initialUsers = [
    { username: 'user', email: 'user@example.com', password: '123', role: 'user', valid: true },
    { username: 'group', email: 'groupadmin@example.com', password: '123', role: 'group-admin', valid: true },
    { username: 'super', email: 'superadmin@example.com', password: '123', role: 'super-admin', valid: true },
];

const initialGroups = [
    { name: 'General', messages: [], usernames: ['user', 'group', 'super'] },
    { name: 'Random', messages: [], usernames: ['user', 'group', 'super'] }
];


async function loadSampleData(db) {
    try {
        await db.collection('users').insertMany(initialUsers);
        await db.collection('groups').insertMany(initialGroups);
        console.log("Sample data has been inserted into the database");
    } catch (err) {
        console.error("An error occurred while loading the sample data:", err);
    }
}



async function startServer() {
    const client = await MongoClient.connect(uri);
    console.log("Connected to the database");

    const db = client.db(dbName);

    const usersCollection = db.collection('users');

    const messagesCollection = db.collection('groups');

    await loadSampleData(db);
    async function migrateData(db) {
        try {
            const groups = await db.collection('groups').find().toArray();
            for (const group of groups) {
                const usernames = [...new Set([...(group.members || []), ...(group.admins || [])])];
                await db.collection('groups').updateOne(
                    { _id: group._id },
                    { $set: { usernames } }
                );
            }

            console.log("Data migration completed");
        } catch (err) {
            console.error("An error occurred during data migration:", err);
        }
    }
    const server = http.Server(app);
    const io = socketIO(server);
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    app.post('/api/auth', async (req, res) => {
        const { username, password } = req.body;

        try {
            const dbUser = await db.collection('users').findOne({ username, password });

            if (dbUser) {
                res.json({
                    valid: true,
                    username: dbUser.username,
                    email: dbUser.email,
                    role: dbUser.role,
                });
            } else {
                res.status(401).json({ valid: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/api/signup', async (req, res) => {
        const { username, email, password, role } = req.body;
        const newUser = { username, email, password, role, valid: true };

        try {
            const result = await db.collection('users').insertOne(newUser);
            res.json(newUser);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/api/chat-groups', async (req, res) => {
        try {
            const groups = await db.collection('groups').find().toArray();
            res.json(groups);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.post('/api/chat-groups', async (req, res) => {
        const newGroup = {
            name: req.body.name,
            messages: [],
            usernames: req.body.usernames || []
        };

        try {
            const result = await db.collection('groups').insertOne(newGroup);
            res.json({ ...newGroup, _id: result.insertedId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/api/users', async (req, res) => {
        try {
            const users = await db.collection('users').find().toArray();
            const groups = await db.collection('groups').find().toArray();

            // 로깅을 추가하여 어떤 그룹이 usernames 속성을 가지고 있지 않은지 확인
            groups.forEach((group, index) => {
                if (!group.usernames) {
                    console.error(`Group at index ${index} does not have a usernames property`, group);
                }
            });

            const usersWithGroups = users.map(user => {
                // Safe navigation to avoid error if usernames is not defined
                const userGroups = groups.filter(group => group.usernames?.includes(user.username));
                return {
                    ...user,
                    groups: userGroups.map(group => ({ _id: group._id, name: group.name }))
                };
            });

            res.json(usersWithGroups);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.delete('/api/chat-groups/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const result = await db.collection('groups').deleteOne({ _id: new MongoClient.ObjectId(id) });
            if (result.deletedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.put('/api/users/:id/role', async (req, res) => {
        const { id } = req.params;
        const { newRole } = req.body;

        try {
            const result = await db.collection('users').updateOne(
                { _id: new MongoClient.ObjectId(id) },
                { $set: { role: newRole } }
            );

            if (result.modifiedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.delete('/api/users/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const result = await db.collection('users').deleteOne({ _id: new MongoClient.ObjectId(id) });

            if (result.deletedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.delete('/api/users/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const result = await db.collection('users').deleteOne({ _id: new MongoClient.ObjectId(id) });

            if (result.deletedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.put('/api/users/:id', async (req, res) => {
        const { id } = req.params;
        const { role } = req.body;

        try {
            const result = await db.collection('users').updateOne(
                { _id: new MongoClient.ObjectId(id) },
                { $set: { role } }
            );

            if (result.modifiedCount === 1) {
                res.json({ success: true, role });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.put('/api/chat-groups/:id/add-user', async (req, res) => {
        const { id } = req.params;
        const { username } = req.body;

        try {
            const result = await db.collection('groups').updateOne(
                { _id: new MongoClient.ObjectId(id), usernames: { $nin: [username] } },
                { $push: { usernames: username } }
            );

            if (result.modifiedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.put('/api/chat-groups/:id/remove-user', async (req, res) => {
        const { id } = req.params;
        const { username } = req.body;

        try {
            const result = await db.collection('groups').updateOne(
                { _id: new MongoClient.ObjectId(id), usernames: { $in: [username] } },
                { $pull: { usernames: username } }
            );

            if (result.modifiedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
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

        socket.on('send message', async (data) => {
            const { message, roomId } = data;

            try {
                // Find the group in the MongoDB
                const group = await db.collection('groups').findOne({ _id: new MongoClient.ObjectId(roomId) });

                if (group) {
                    // Push the new message into the messages array in the MongoDB collection
                    await db.collection('groups').updateOne(
                        { _id: new MongoClient.ObjectId(roomId) },
                        { $push: { messages: { content: message } } }
                    );

                    // Emit the message to all clients in the room
                    io.to(roomId).emit('new message', { roomId, message });
                } else {
                    // Emit an error if the group is not found
                    socket.emit('error', 'Group not found');
                }
            } catch (error) {
                console.error(error);
                socket.emit('error', 'Internal Server Error');
            }
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

}

startServer();