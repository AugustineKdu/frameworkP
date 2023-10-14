const express = require('express');
const { MongoClient } = require('mongodb');

const socketIO = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const port = 3000;


const fs = require('fs');
app.use(cors({
    origin: 'http://localhost:4200'
}));

const uri = "mongodb://localhost:27017";
const dbName = "mychatDB";

const fileUpload = require('express-fileupload');
// video chat 
const { PeerServer } = require('peer');

const peerServer = PeerServer({
    port: 9000,
    path: '/myapp'
});


app.use(express.json());

const initialUsers = [
    { username: 'user', email: 'user@example.com', password: '123', role: 'user', valid: true },
    { username: 'group', email: 'groupadmin@example.com', password: '123', role: 'group-admin', valid: true },
    { username: 'super', email: 'superadmin@example.com', password: '123', role: 'super-admin', valid: true },
];

const initialGroups = [
    {
        _id: 'g1',
        name: 'General',
        messages: [
            { sender: 'user1', content: 'Hello everyone!', timestamp: new Date() },
            { sender: 'user2', content: 'Hi!', timestamp: new Date() },
            // ... more messages
        ],
        usernames: ['user1', 'group', 'super']
    },
    {
        _id: 'g2',
        name: 'General22222222',
        messages: [
            { sender: 'user1', content: 'Hello everyone!', timestamp: new Date() },
            { sender: 'user2', content: 'Hi!', timestamp: new Date() },
            // ... more messages
        ],
        usernames: ['user1', 'group', 'super']
    },
    // ... more groups
];
const chatGroups = initialGroups;


async function initializeDatabase() {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const db = client.db(dbName);

        // Check if 'users' and 'groups' collections are empty
        const usersCount = await db.collection('users').countDocuments({});
        const groupsCount = await db.collection('groups').countDocuments({});

        // If they are empty, insert the initial users and groups
        if (usersCount === 0) {
            await db.collection('users').insertMany(initialUsers);
        }

        if (groupsCount === 0) {
            await db.collection('groups').insertMany(initialGroups);
        }

        console.log("Database has been checked and initialized if needed");
    } catch (err) {
        console.error("An error occurred while checking or initializing the database:", err);
    } finally {
        await client.close();
    }
}

initializeDatabase();
async function loadSampleData(db) {
    try {
        // 1. 데이터베이스 클리어 (옵션)
        await db.collection('users').deleteMany({});
        await db.collection('groups').deleteMany({});

        // 2. 고유성 확인 및 데이터 삽입
        for (const user of initialUsers) {
            const existingUser = await db.collection('users').findOne({ username: user.username });
            if (!existingUser) {
                await db.collection('users').insertOne(user);
            }
        }

        for (const group of initialGroups) {
            const existingGroup = await db.collection('groups').findOne({ _id: group._id });
            if (!existingGroup) {
                await db.collection('groups').insertOne(group);
            }
        }

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
    const io = socketIO(server, {
        cors: {
            origin: "http://localhost:4200",
            methods: ["GET", "POST"]
        }
    });
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
    const INTERNAL_SERVER_ERROR_MSG = 'Internal Server Error';

    app.get('/api/chat-groups', async (req, res) => {
        try {
            const groups = await db.collection('groups').find().toArray();
            res.status(200).json(groups);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: INTERNAL_SERVER_ERROR_MSG });
        }
    });

    app.post('/api/chat-groups', async (req, res) => {
        // Validation: Ensure that the name is provided and is a string
        if (!req.body.name || typeof req.body.name !== 'string') {
            return res.status(400).json({ error: 'Group name is required and should be a string' });
        }

        // Validation: Ensure that usernames, if provided, is an array of strings
        if (req.body.usernames && (!Array.isArray(req.body.usernames) || !req.body.usernames.every(username => typeof username === 'string'))) {
            return res.status(400).json({ error: 'Usernames should be an array of strings' });
        }

        const newGroup = {
            name: req.body.name,
            messages: [],
            usernames: req.body.usernames || []
        };

        try {
            const result = await db.collection('groups').insertOne(newGroup);
            res.status(201).json({ ...newGroup, _id: result.insertedId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: INTERNAL_SERVER_ERROR_MSG });
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
            const result = await db.collection('groups').deleteOne({ _id: id });

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
    app.use(fileUpload());

    app.post('/upload-avatar', (req, res) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        // The name of the input field is used to retrieve the uploaded file
        let avatar = req.files.avatar;
        let uploadPath = __dirname + '/uploads/avatars/' + avatar.name;

        // Use mv() to place the file on the server
        avatar.mv(uploadPath, function (err) {
            if (err)
                return res.status(500).send(err);

            res.send('File uploaded!');
        });
    });

    app.post('/upload', (req, res) => {
        let uploadedFile = req.files.file; // access uploaded file
        let filename = `${__dirname}/uploads/${uploadedFile.name}`;

        // Use the mv() method to place the file on your server
        uploadedFile.mv(filename, (err) => {
            if (err) {
                return res.status(500).send(err);
            }

            // Save filepath to MongoDB (for example)


            res.send('File uploaded!');
        });
    });

    // io.on('connection', (socket) => {
    //     console.log(`User ${socket.id} connected`);


    //     // Server-side code

    //     socket.on('send message', async (data) => {
    //         const { message, groupId } = data; // Extracting groupId

    //         try {
    //             // Check if the group exists in the database
    //             const group = await db.collection('groups').findOne({ _id: groupId });

    //             if (group) {
    //                 // Add the message to the group's messages in the database
    //                 await db.collection('groups').updateOne(
    //                     { _id: groupId },
    //                     { $push: { messages: { sender: message.sender, content: message.content, timestamp: new Date() } } }
    //                 );

    //                 // Send the message to all clients in the group (using group ID as the room ID)
    //                 io.to(groupId).emit('new message', { groupId, message });
    //             } else {
    //                 // Handle the error if the group is not found
    //                 socket.emit('error', 'Group not found');
    //             }
    //         } catch (error) {
    //             console.error(error);
    //             socket.emit('error', 'Internal Server Error');
    //         }
    //     });
    //     // Server-side code

    //     socket.on('join room', (groupId) => {
    //         socket.join(groupId);
    //         console.log(`User ${socket.id} joined room ${groupId}`);
    //     });


    //     socket.on('disconnect', () => {
    //         console.log(`User ${socket.id} disconnected`);
    //     });
    // });
    // io.on('connection', (socket) => {
    //     console.log('New user connected');

    //     socket.on('joinRoom', (roomId) => {
    //         socket.join(roomId);
    //         console.log(`User ${socket.id} joined room ${roomId}`);
    //     });

    //     socket.on('leaveRoom', (roomId) => {
    //         socket.leave(roomId);
    //         console.log(`User ${socket.id} left room ${roomId}`);
    //     });

    //     socket.on('send message', (data) => {
    //         const { message, roomId } = data;
    //         const group = chatGroups.find(group => group.id === parseInt(roomId));

    //         if (group) {
    //             group.messages.push({ content: message });
    //             io.to(roomId).emit('new message', { roomId, message });
    //         } else {
    //             // Emit an error if the group is not found
    //             socket.emit('error', 'Group not found');
    //         }
    //     });
    //     socket.on('disconnect', () => {
    //         console.log(`User ${socket.id} disconnected`);
    //     });
    // });
    //try with group -> _id
    io.on('connection', (socket) => {
        console.log('New user connected');

        socket.on('joinRoom', (_id) => {
            socket.join(_id);
            console.log(`User ${socket.id} joined room ${_id}`);
        });

        socket.on('leaveRoom', (roo_idmId) => {
            socket.leave(_id);
            console.log(`User ${socket.id} left room ${_id}`);
        });

        socket.on('send message', (data) => {
            const { message, _id } = data;
            const group = chatGroups.find(group => group.id === parseInt(_id));

            if (group) {
                group.messages.push({ content: message });
                io.to(_id).emit('new message', { _id, message });
            } else {
                // Emit an error if the group is not found
                socket.emit('error', 'Group not found');
            }
        });
        socket.on('disconnect', () => {
            console.log(`User ${socket.id} disconnected`);
        });
    });
}

startServer();