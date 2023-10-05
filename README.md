# frameworkP
# Chat Application Documentation

## Table of Contents
1. [Git Repository Organization]
2. [Data Structures]
3. [Angular Architecture]
4. [Node Server Architecture]
5. [Server-Side Routes]
6. [Client-Server Interaction]
7. [Data Persistence]

---

## Git Repository Organization: https://github.com/AugustineKdu/frameworkP

- **Frontend**: Contains all Angular client-side code.
- **Backend**: Contains the Node.js server-side code.

### Branching Strategy
- `main`: The main production branch.

### Update Frequency
Commits are made at the end of each completed feature or bug fix.

---

## Data Structures
### Client-Side
- **User**: Represents a user in the system. Fields include `username`, `email`, `role`, and `valid`.
- **ChatGroup**: Represents a chat group. Fields include `id`, `name`, and `messages`.

### Server-Side
- **users**: An array of user objects for authentication. Each object includes `username`, `email`, `password`, `role`, and `valid`.
- **chatGroups**: An array of chat group objects, each containing an array of messages.

---

## Angular Architecture

- **Components**: `ChatComponent`, `LoginComponent`, `AccountComponent`, `DashboardComponent`, `SuperAdminDashboardComponent`, `GroupAdminDashboardComponent`, `SignupComponent`, 
- **Services**:  `ChatService` for chat functionalities.
- **Models**: `User`, `ChatGroup`
- **Routes**: Defined in `AppRoutingModule`, includes routes for login, account management, dashboards, and chat. The home screen uses the `DashboardComponent`, which varies based on the user's role (super-admin, group-admin, or user).

---

## Node Server Architecture

### Modules
- `express`: For setting up the HTTP server and routing.
- `socket.io`: For real-time bi-directional communication.

### Functions
- `app.post('/api/auth')`: Handles user authentication by checking `username` and `password` against a predefined list of users. If authentication is successful, it returns user data; otherwise, it returns a 401 status.
- `joinRoom`: Handles user joining a room.
- `sendMessage`: Handles sending messages.
 - 'signup': add the new user data on json and local file
### Files
- `server.js`: The main server file containing all the setup, routing, and socket.io logic.

### Global Variables
- `users`: Holds the state of all users for authentication.
- `chatGroups`: Holds the state of all chat groups.

---

## Server-Side Routes

- **POST /api/auth**: Authenticate a user.
  - **Parameters**: `username`, `password`
  - **Returns**: User data or 401 status.

- **GET /api/chat-groups**: Get all chat groups.
  - **Parameters**: None
  - **Returns**: Array of `ChatGroup`

- **POST /api/chat-groups**: Add a new chat group.
  - **Parameters**: `name`
  - **Returns**: The newly created `ChatGroup`

- **DELETE /api/chat-groups/:id**: Delete a chat group.
  - **Parameters**: `id`
  - **Returns**: Success or failure status.

- **POST /api/signup:** Register a new user.
  - **Parameters:** username, email, password, role
  - **Returns:** The newly created user.

---

## Client-Server Interaction

- When a user joins a chat group, the `joinRoom` event is emitted from the client to the server.
- The server then updates the user's current chat group and broadcasts any new messages to that group.
- The Angular `ChatComponent` listens for these messages and updates its display when a new message is received.

---

## Data Persistence

- The server uses JSON files to persistently store the state of chat groups.
- Data is loaded from the JSON file when the server starts and saved back to the JSON file whenever there are changes to the chat groups.

