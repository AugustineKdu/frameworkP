const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

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

//const fileUpload = require('express-fileupload');
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
const initialChatGroups = [
    {
        _id: '1',
        name: 'General',
        messages: [
            { sender: 'user1', content: 'Hello everyone!', timestamp: new Date() },
            { sender: 'user2', content: 'Hi!', timestamp: new Date() },
            // ... more messages
        ],
        usernames: ['user', 'group', 'super']
    },
    {
        _id: '2',
        name: 'General22222222',
        messages: [
            { sender: 'user1', content: 'Hello everyone!', timestamp: new Date() },
            { sender: 'user2', content: 'Hi!', timestamp: new Date() },
            // ... more messages
        ],
        usernames: ['user', 'group', 'super']
    },
    // ... more groups
];
async function initializeDatabase() {
    const client = await MongoClient.connect(uri);

    try {
        const db = client.db(dbName);

        // Check if 'users' and 'groups' collections are empty
        const usersCount = await db.collection('users').countDocuments({});
        const groupsCount = await db.collection('chatGroups').countDocuments({});

        // If they are empty, insert the initial users and groups
        if (usersCount === 0) {
            await db.collection('users').insertMany(initialUsers);
        }

        if (groupsCount === 0) {
            await db.collection('chatGroups').insertMany(initialChatGroups);
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

        await db.collection('users').deleteMany({});
        await db.collection('chatGroups').deleteMany({});


        for (const user of initialUsers) {
            const existingUser = await db.collection('users').findOne({ username: user.username });
            if (!existingUser) {
                await db.collection('users').insertOne(user);
            }
        }

        for (const group of initialChatGroups) {
            const existingChatGroup = await db.collection('chatGroups').findOne({ _id: group.id });
            if (!existingChatGroup) {
                await db.collection('chatGroups').insertOne(group);
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

    const messagesCollection = db.collection('chatGroups');

    await loadSampleData(db);
    async function migrateData(db) {
        try {
            const groups = await db.collection('chatGroups').find().toArray();
            for (const group of groups) {
                const usernames = [...new Set([...(group.members || []), ...(group.admins || [])])];
                await db.collection('chatGroups').updateOne(
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
    //Authentication APIs
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
    //User APIs
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
    //image control APIs
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
    //ChatGroup APIs

    // API to get all chat groups
    app.get('/api/chat-groups', async (req, res) => {
        try {
            const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(dbName);
            const chatGroups = await db.collection('chatGroups').find().toArray();
            res.json(chatGroups);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
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
            const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(dbName);
            const result = await db.collection('chatGroups').insertOne(newGroup);
            res.json(result.ops[0]);  // Return the new chat group
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // API to delete a chat group
    app.delete('/api/chat-groups/:id', async (req, res) => {
        const _id = req.params.id;
        try {
            const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(dbName);
            const result = await db.collection('chatGroups').deleteOne({ _id: new MongoClient.ObjectId(_id) });
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
                // Add the message to the database
                const result = await db.collection('chatGroups').updateOne(
                    { _id: roomId },
                    { $push: { messages: message } }
                );
                // Emit the message to other users in the room
                io.to(roomId).emit('new message', { roomId, message });
            } catch (error) {
                console.error(error);
                socket.emit('error', 'Internal Server Error');
            }
        });




        socket.on('disconnect', () => {
            console.log(`User disconnected`);
        });
    });

}
startServer();