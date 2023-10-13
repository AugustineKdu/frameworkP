const express = require('express');
const { MongoClient } = require('mongodb');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const port = 3000;



const uri = "mongodb://localhost:27017";
const dbName = "mychatDB";

app.use(express.json());



async function loadSampleData(db) {
    try {
        const initialUsers = [
            { username: 'user', email: 'user@example.com', password: '123', role: 'user', groups: [] },
            { username: 'groupAdmin', email: 'groupAdmin@example.com', password: '123', role: 'group-admin', groups: [] },
            { username: 'superAdmin', email: 'superAdmin@example.com', password: '123', role: 'super-admin', groups: [] }
        ];

        const userResults = await db.collection('users').insertMany(initialUsers);
        const userIds = userResults.insertedIds;

        const initialGroups = [
            { name: 'Group1', members: [userIds['0']], admins: [userIds['1']], channels: [] },
            // ... other groups
        ];

        const groupResults = await db.collection('groups').insertMany(initialGroups);
        const groupIds = groupResults.insertedIds;

        const initialChannels = [
            { name: 'Channel1', groupId: groupIds['0'], members: [userIds['0'], userIds['1']] },
            // ... other channels
        ];

        const channelResults = await db.collection('channels').insertMany(initialChannels);
        const channelIds = channelResults.insertedIds;

        const initialMessages = [
            {
                text: 'Welcome to Channel1!',
                userId: null,  // system-generated message
                channelId: channelIds['0'],
                timestamp: new Date(),
                media: null
            },
            // ... other messages
        ];

        await db.collection('messages').insertMany(initialMessages);

        console.log("Sample data, including a greeting message, has been inserted into the database");
    } catch (err) {
        console.error("An error occurred while loading the sample data:", err);
    }
}
async function startServer() {
    const client = await MongoClient.connect(uri);
    console.log("Connected to the database");

    const db = client.db(dbName);

    const usersCollection = db.collection('users');
    const groupsCollection = db.collection('groups');
    const channelsCollection = db.collection('channels');
    const messagesCollection = db.collection('messages');

    await loadSampleData(db);

    const server = http.Server(app);
    const io = socketIO(server);

    // Implement your API and Socket.IO event handlers here
    app.post('/users', async (req, res) => {
        try {
            const { username, email, password, role } = req.body;
            // 유효성 검사 및 비밀번호 해싱 코드를 여기에 작성하세요.
            const newUser = await usersCollection.insertOne({ username, email, password, role });
            res.status(201).json(newUser.ops[0]);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/users', async (req, res) => {
        try {
            const users = await usersCollection.find({}).toArray();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.put('/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { username, email, password, role } = req.body; // 예시 필드
            const result = await usersCollection.updateOne(
                { _id: MongoClient.ObjectId(id) },
                { $set: { username, email, password, role } }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ message: 'User Updated Successfully' });
            } else {
                res.status(404).json({ error: 'User Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.delete('/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await usersCollection.deleteOne({ _id: MongoClient.ObjectId(id) });
            if (result.deletedCount > 0) {
                res.status(200).json({ message: 'User Deleted Successfully' });
            } else {
                res.status(404).json({ error: 'User Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/groups', async (req, res) => {
        try {
            const { name, members, admins, channels } = req.body; // 예시 필드
            const newGroup = await groupsCollection.insertOne({ name, members, admins, channels });
            res.status(201).json(newGroup.ops[0]);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/groups/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const group = await groupsCollection.findOne({ _id: MongoClient.ObjectId(id) });
            if (group) {
                res.status(200).json(group);
            } else {
                res.status(404).json({ error: 'Group Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/groups', async (req, res) => {
        try {
            const groups = await groupsCollection.find({}).toArray();
            res.status(200).json(groups);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.put('/groups/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, members, admins, channels } = req.body;
            const result = await groupsCollection.updateOne(
                { _id: MongoClient.ObjectId(id) },
                { $set: { name, members, admins, channels } }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ message: 'Group Updated Successfully' });
            } else {
                res.status(404).json({ error: 'Group Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.delete('/groups/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await groupsCollection.deleteOne({ _id: MongoClient.ObjectId(id) });
            if (result.deletedCount > 0) {
                res.status(200).json({ message: 'Group Deleted Successfully' });
            } else {
                res.status(404).json({ error: 'Group Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/channels', async (req, res) => {
        try {
            const { name, groupId, members } = req.body;
            const newChannel = await channelsCollection.insertOne({ name, groupId, members });
            res.status(201).json(newChannel.ops[0]);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/channels', async (req, res) => {
        try {
            const channels = await channelsCollection.find({}).toArray();
            res.status(200).json(channels);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/channels/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const channel = await channelsCollection.findOne({ _id: MongoClient.ObjectId(id) });
            if (channel) {
                res.status(200).json(channel);
            } else {
                res.status(404).json({ error: 'Channel Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.put('/channels/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, groupId, members } = req.body;
            const result = await channelsCollection.updateOne(
                { _id: MongoClient.ObjectId(id) },
                { $set: { name, groupId, members } }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ message: 'Channel Updated Successfully' });
            } else {
                res.status(404).json({ error: 'Channel Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.delete('/channels/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await channelsCollection.deleteOne({ _id: MongoClient.ObjectId(id) });
            if (result.deletedCount > 0) {
                res.status(200).json({ message: 'Channel Deleted Successfully' });
            } else {
                res.status(404).json({ error: 'Channel Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/messages', async (req, res) => {
        try {
            const { text, userId, channelId, timestamp, media } = req.body;
            const newMessage = await messagesCollection.insertOne({ text, userId, channelId, timestamp, media });
            res.status(201).json(newMessage.ops[0]);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/messages', async (req, res) => {
        try {
            const messages = await messagesCollection.find({}).toArray();
            res.status(200).json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.get('/messages/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const message = await messagesCollection.findOne({ _id: MongoClient.ObjectId(id) });
            if (message) {
                res.status(200).json(message);
            } else {
                res.status(404).json({ error: 'Message Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.put('/messages/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { text, userId, channelId, timestamp, media } = req.body;
            const result = await messagesCollection.updateOne(
                { _id: MongoClient.ObjectId(id) },
                { $set: { text, userId, channelId, timestamp, media } }
            );
            if (result.matchedCount > 0) {
                res.status(200).json({ message: 'Message Updated Successfully' });
            } else {
                res.status(404).json({ error: 'Message Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.delete('/messages/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await messagesCollection.deleteOne({ _id: MongoClient.ObjectId(id) });
            if (result.deletedCount > 0) {
                res.status(200).json({ message: 'Message Deleted Successfully' });
            } else {
                res.status(404).json({ error: 'Message Not Found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });


    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });


    io.on('connection', (socket) => {
        console.log('a user connected');

        // Example Socket.IO event handler: Send a message
        socket.on('message', async (data) => {
            try {
                const { userId, groupId, text } = data;
                const newMessage = { userId: userId, groupId: groupId, text, timestamp: new Date() };
                await messagesCollection.insertOne(newMessage);

                // Broadcast message to other clients
                socket.broadcast.emit('message', newMessage);
            } catch (e) {
                console.error(e);
            }
        });
        io.on('connection', (socket) => {
            socket.on('join-channel', async (data) => {
                const { channelId, userId } = data;
                socket.join(channelId);

                // Notify all clients in the room, except the sender
                socket.to(channelId).emit('user-joined', { userId });
            });
        });
        socket.on('leave-channel', async (data) => {
            const { channelId, userId } = data;
            socket.leave(channelId);

            // Notify all clients in the room
            io.in(channelId).emit('user-left', { userId });
        });
        socket.on('new-message', async (data) => {
            const { channelId, userId, text, timestamp } = data;
            const message = { channelId, userId, text, timestamp };

            // Save message to DB
            const result = await messagesCollection.insertOne(message);

            // Broadcast message to all clients in the room, including the sender
            io.in(channelId).emit('new-message', { ...message, _id: result.insertedId });
        });
        socket.on('update-message', async (data) => {
            const { messageId, newText } = data;

            // Update message in DB
            await messagesCollection.updateOne(
                { _id: MongoClient.ObjectId(messageId) },
                { $set: { text: newText } }
            );

            // Notify all clients about the updated message
            const updatedMessage = await messagesCollection.findOne({ _id: MongoClient.ObjectId(messageId) });
            io.in(updatedMessage.channelId).emit('update-message', updatedMessage);
        });
        socket.on('delete-message', async (data) => {
            const { messageId } = data;

            // Find message for channelId before deletion
            const message = await messagesCollection.findOne({ _id: MongoClient.ObjectId(messageId) });

            // Delete message from DB
            await messagesCollection.deleteOne({ _id: MongoClient.ObjectId(messageId) });

            // Notify all clients in the channel about the deleted message
            io.in(message.channelId).emit('delete-message', { messageId });
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
}

startServer();