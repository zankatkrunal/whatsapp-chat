# ChatConnect — Real-Time WhatsApp-Style Messaging Web Application

ChatConnect is a production-ready, full-stack, real-time messaging web application inspired by the functionality, design aesthetics, and user experience of WhatsApp Web. It delivers multi-user bidirectional real-time communications over the internet via WebSockets (Socket.IO) and REST APIs backed by MongoDB.

---

## 🌟 Key Features

1. **Complete Authentication System**
   - Instant user registration with Full Name, Username, Email, Password, and Avatar presets (Phone number is completely optional!).
   - Login via Username or Email + Password.
   - JWT tokens with Bearer authorization and Socket.IO handshake authentication.
   - Password security with `bcryptjs` (salt rounds = 10); hashes never exposed in API responses.
   - Protected client routes (`/`, `/chat/:id`, `/profile`, `/settings`, `/groups`).

2. **Real-Time Messaging with Socket.IO**
   - Instant message transmission and receiving without browser refreshes.
   - WhatsApp-style message receipts:
     - `✓` Single grey check = Sent
     - `✓✓` Double grey checks = Delivered
     - `✓✓` Double cyan/blue checks = Read
   - Real-time typing indicators ("User is typing...").
   - Online/Offline presence tracking with last-seen timestamps.
   - Reconnection synchronization & connection status indicator ("Connected", "Connecting...", "Offline").

3. **Rich Message Capabilities**
   - Quoted replies: reply to any specific text or media message.
   - Deletion: "Delete for me" and "Delete for everyone" (replaces message with *"This message was deleted"*).
   - Message forwarding across conversations.
   - Copy text to clipboard.
   - Built-in WhatsApp emoji picker with category tabs and fast search.
   - Audio chime synthesizer for incoming messages (zero external audio dependencies).
   - Desktop browser notifications.

4. **Media & File Attachments**
   - Photo and video uploads with instant previews and full-screen lightbox modal.
   - Audio voice note playback with interactive waveform/slider and timer controls.
   - Document sharing (PDF, Word, Excel, PowerPoint, TXT, Archives) with file sizes and one-click downloads.
   - Dangerous script and executable upload prevention (`.exe`, `.bat`, `.sh`, `.vbs`, etc.).
   - Support for both local storage (`/uploads/`) and optional cloud storage (Cloudinary).

5. **Group Chats**
   - Group creation with custom title, avatar, and description.
   - Multi-user member selection.
   - Admin roles and permissions: add members, remove members, update group info.
   - Member capability to leave groups.
   - System messages for group creation, membership changes, and departures.

6. **Privacy & Contact Management**
   - Fast user search by name, username, email, or phone number.
   - Block and unblock contacts with dedicated privacy controls.
   - Prevent blocked users from exchanging messages.
   - Privacy settings: customizable Last Seen visibility.

7. **Appearance & UI/UX Quality**
   - WhatsApp Web inspired dark and light mode themes with CSS custom properties.
   - System color scheme synchronization.
   - Responsive design: side-by-side desktop view and dedicated mobile chat-to-list navigation drawers.
   - Chat settings: customizable Enter key send behavior.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React.js 18
- **Tooling**: Vite 6
- **Real-Time Client**: Socket.IO Client 4.8
- **HTTP Client**: Axios 1.7
- **Routing**: React Router DOM 6
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System with CSS Variables, Dark/Light Themes, and Responsive Breakpoints

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Real-Time Server**: Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **In-Memory Fallback**: `mongodb-memory-server` (automatic zero-config local development mode)
- **Security**: Helmet, CORS, Express Rate Limit, Bcryptjs, JSON Web Tokens
- **File Uploads**: Multer with file type & extension sanitization
- **Cloud Storage**: Cloudinary SDK (optional)

---

## 📁 Project Structure

```text
chatconnect/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── assets/             # Brand logos and static resources
│   │   ├── components/
│   │   │   ├── chat/           # ChatArea, Header, MessageBubble, Inputs, Modals
│   │   │   ├── common/         # Avatar, Modal, EmojiPicker, AudioPlayer, StatusIcon
│   │   │   ├── group/          # GroupInfoDrawer
│   │   │   ├── profile/        # ProfileDrawer
│   │   │   ├── settings/       # SettingsDrawer, BlockedUsersModal
│   │   │   └── sidebar/        # Sidebar, SearchBar, ConversationList, NewChatModal
│   │   ├── context/            # AuthContext, SocketContext, ChatContext, ThemeContext
│   │   ├── pages/              # LoginPage, RegisterPage, ChatPage, NotFoundPage
│   │   ├── services/           # Axios API services (auth, chat, message, group, upload)
│   │   ├── App.jsx             # Main routing and provider setup
│   │   ├── index.css           # Global design system & WhatsApp themes
│   │   └── main.jsx            # Entry point
│   ├── index.html              # HTML shell & font definitions
│   ├── package.json
│   └── vite.config.js          # Vite config with API proxy
│
├── server/                     # Backend Node.js + Express + Socket.IO server
│   ├── config/
│   │   ├── db.js               # MongoDB connection with memory-server fallback
│   │   └── cloudinary.js       # Cloud storage configuration
│   ├── controllers/            # Auth, User, Conversation, Message, Group, Block, Upload
│   ├── middleware/             # JWT auth, upload validation, rate limits, error handling
│   ├── models/                 # User, Conversation, Message, Group, BlockedUser, Notification
│   ├── routes/                 # REST endpoints
│   ├── sockets/                # Socket.IO auth, presence, chat, and group handlers
│   ├── utils/
│   │   ├── seed.js             # Optional demo seed database populator
│   │   └── token.js            # JWT generator and validator
│   ├── uploads/                # Local file upload directory
│   ├── app.js                  # Express application setup
│   ├── server.js               # Server bootstrap & Socket.IO listener
│   ├── package.json
│   └── .env.example
│
├── ecosystem.config.js         # PM2 production cluster configuration
├── nginx.conf.example          # Production Nginx reverse proxy with SSL & WSS
├── .gitignore
├── .env.example
├── README.md
└── package.json                # Root coordinator package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance (local `mongod` or MongoDB Atlas URI) *— Note: ChatConnect includes an automatic in-memory MongoDB fallback if no local MongoDB service is running.*

---

### Step 1: Install Dependencies

From the project root:
```bash
# On Windows PowerShell:
npm.cmd --prefix server install
npm.cmd --prefix client install
```
Or run the root shortcut:
```bash
npm.cmd run install:all
```

---

### Step 2: Configure Environment Variables

Create `.env` inside `server/` (or copy `server/.env.example`):
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/chatconnect
JWT_SECRET=super_secret_jwt_key_chatconnect_2025_prod_safe
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary credentials (leave blank to use local server/uploads/)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MAX_FILE_SIZE=52428800
```

---

### Step 3: (Optional) Seed Test Accounts

To populate realistic demo users and sample chat messages:
```bash
npm.cmd --prefix server run seed
```
This generates 4 test accounts:
1. `alex@example.com` / `password123`
2. `sarah@example.com` / `password123`
3. `david@example.com` / `password123`
4. `priya@example.com` / `password123`

---

### Step 4: Run the Application

#### Option A: Run Backend and Frontend Concurrently
```bash
npm.cmd run dev
```

#### Option B: Run in Separate Terminals
**Terminal 1 (Backend API & Socket.IO Server):**
```bash
npm.cmd --prefix server run dev
```
Server runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

**Terminal 2 (Frontend Client):**
```bash
npm.cmd --prefix client run dev
```
Client runs at `http://localhost:5173`.

---

## 📡 Socket.IO Real-Time Events Reference

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `connection` | Client → Server | `{ token }` in auth handshake | Authenticated handshake |
| `userOnline` | Server → Client | `{ userId, isOnline: true }` | Broadcasts user came online |
| `userOffline` | Server → Client | `{ userId, isOnline: false, lastSeen }` | Broadcasts user went offline |
| `joinConversation` | Client → Server | `conversationId` | Joins room `conversation_${id}` |
| `leaveConversation`| Client → Server | `conversationId` | Leaves room `conversation_${id}` |
| `sendMessage` | Client → Server | Message payload + `clientTempId` | Saves to DB & sends message |
| `messageSent` | Server → Sender | Saved message + `clientTempId` | Confirms message persisted |
| `receiveMessage` | Server → Room | Full populated message object | Real-time message arrival |
| `messageDelivered` | Server → Sender | `{ messageId, conversationId, status: 'delivered' }` | Updates delivery receipt |
| `markConversationRead`| Client → Server | `{ conversationId }` | Marks messages read in DB |
| `messageRead` | Server → Sender | `{ conversationId, readerId, status: 'read' }` | Turns checkmarks blue |
| `typing` | Client → Server | `{ conversationId }` | Broadcasts typing indicator |
| `stopTyping` | Client → Server | `{ conversationId }` | Clears typing indicator |
| `messageDeleted` | Client ↔ Server | `{ messageId, conversationId, deleteType }` | Syncs deleted message state |
| `messageForwarded`| Client ↔ Server | `{ targetConversationId, message }` | Syncs forwarded message |
| `groupCreated` | Client ↔ Server | `{ group, conversation }` | Notifies new group members |

---

## 🛡️ Production Deployment Guide

### Architecture Overview
```text
Browser Client
     │ (HTTPS / WSS)
     ▼
Nginx (Reverse Proxy & SSL Termination)
  ├── Static requests (/) ───────► /var/www/chatconnect/client/dist
  ├── Static media (/uploads/) ──► /var/www/chatconnect/server/uploads
  └── Dynamic requests (/api, /socket.io)
           │
           ▼
PM2 Cluster (Node.js + Express + Socket.IO)
           │
           ▼
MongoDB Atlas (Cloud Database Cluster)
```

### 1. Build Frontend for Production
```bash
npm.cmd --prefix client run build
```
The compiled SPA bundle will be placed in `client/dist`.

### 2. Configure PM2 Process Manager
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 3. Setup Nginx
1. Copy `nginx.conf.example` to `/etc/nginx/sites-available/chatconnect`.
2. Update your domain name and SSL paths.
3. Enable the configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/chatconnect /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 4. Health Check Endpoint
Monitor service uptime via:
```bash
curl https://your-domain.com/api/health
```
Response:
```json
{
  "status": "ok",
  "uptime": 1284.5,
  "timestamp": "2026-10-07T09:40:00.000Z"
}
```

---

## 🔒 Security Best Practices Implemented
- **Helmet HTTP Headers**: Mitigates XSS, MIME sniffing, and clickjacking attacks.
- **Strict Content-Type Validation**: Prevents execution of dangerous files.
- **File Upload Protection**: All script and executable formats (`.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.msi`) are strictly banned.
- **Password Protection**: Passwords are saved only as bcrypt hashes.
- **JWT Authorization**: All socket and REST requests are verified with bearer token signatures.
- **Rate Limiting**: Brute-force login and register protection via `express-rate-limit`.

---

## 📄 License
MIT License. Created for ChatConnect real-time messaging application.
