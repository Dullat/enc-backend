# ENC - Backend (The Cryptographic Relay Server)

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

**ENC Backend** is a secure, event-driven Node.js & Express API gateway and WebSocket relay designed for **ENC (Zero-Knowledge E2EE Chat Platform)**. It functions as a blind relay, facilitating connection establishment, public key exchanges, real-time message routing, and authenticated session management without access to plaintext contents or user private keys.

---

## 🔒 Security & Blind Relay Protocol

The backend is built around a **Zero-Knowledge Security Model**:
1.  **Plaintext Separation:** Raw message content and decryption keys are processed entirely client-side. The server stores only base64-encoded ciphertexts, IVs, and RSA-encrypted symmetric keys.
2.  **Encrypted Key Vaulting:** Users register their public key in plaintext and their private key encrypted via client-side derived **PBKDF2** (AES-GCM 256-bit). The backend stores the encrypted private key along with its derivation parameters (`keySalt`, `keyIv`), meaning the server is blind to the raw private key.
3.  **Dual-Token Authentication (JWT):**
    *   **Access Token:** Short-lived (e.g., 15m), sent in request state/cookies.
    *   **Refresh Token:** Long-lived (e.g., 7d), saved in a database collection (`RefreshToken`) and sent to the client via secure, `HttpOnly`, `SameSite=Lax` cookies, neutralizing CSRF and XSS threats.

---

## 🔄 Real-time Routing & Multi-Session Support

The real-time layer is managed via **Socket.io** with custom mapping to support multiple active user connections simultaneously.

```text
userSocketMap = Map<userId, Set<socketId>>
```

### Flow of Socket Connections:
1.  **Authentication Middleware:** Before connecting, Socket.io interceptors parse cookies from headers and verify the user's `accessToken`.
2.  **Session Tracking:** Upon connection, the socket ID is appended to the user's ID `Set` within the in-memory map. This allows users to be logged in on multiple browser tabs or devices concurrently.
3.  **Broadcasting:** When a socket event `sendMessage` is received:
    *   The payload is written to the database (saving the ciphertext message).
    *   The server routes the socket message to **all** active sockets in the receiver's `Set`.
    *   The message is also synchronized back to the sender's **other** active sockets (excluding the source socket) to keep all concurrent tabs in sync.
4.  **Status Propagation:** Emits list of online users dynamically as users connect and disconnect.

---

## 🛠️ Tech Stack & Dependencies

*   **Core Runtime:** Node.js
*   **Web Framework:** Express.js (v5.2)
*   **Database ORM:** Mongoose (v9.2) & MongoDB Atlas
*   **WebSockets:** Socket.io (v4.8)
*   **Cryptography & Security:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs` (server-side password hashing), `cookie-parser`, `cors`
*   **Email & Templates:** `nodemailer` for verification links, `ejs` for rendering server-side password reset forms
*   **Parser utilities:** `busboy` (efficient file stream extraction), `cookie`

---

## 📁 Repository Directory Layout

```text
.
├── controllers/
│   ├── auth.controller.js        # Registration, Login, Logout, Verification, JWT Refresh
│   ├── user.controller.js        # User search, update username, retrieve active sessions
│   ├── chat.controller.js        # Retrieve chat history & conversation lists
│   └── enc.controller.js         # Direct file streaming logic (historical reference)
├── db/
│   └── connectDb.js              # Mongoose MongoDB connection builder
├── errors/
│   └── Errors.error.js           # Customized API classes (BadRequest, NotFound, Unauthorized)
├── middleware/
│   ├── auth.middleware.js        # JWT checking for REST endpoints
│   └── errorhandler.middleware.js# Global centralized Express error formatter
├── models/
│   ├── user.model.js             # User accounts & encrypted cryptographic vault parameters
│   ├── message.model.js          # E2EE encrypted content payload & dual-wrapped AES keys
│   ├── conversation.model.js     # Participant grouping & latest activity tracking
│   └── refreshToken.model.js     # Validated sessions for session tracking
├── routes/
│   ├── user.routes.js            # Auth, Profiles, Sessions, and Reset routes
│   └── chat.routes.js            # Query chat histories & active threads
├── socket/
│   └── socket.js                 # Socket.io setup, cookie authentication, and routing pipelines
├── views/
│   ├── reset-password.ejs        # Server-side HTML password reset page
│   └── reset-success.ejs         # Success conformation page
├── app.js                        # Express app setup and middleware pipeline
├── server.js                     # HTTP Server entrypoint (listening on 5000)
├── package.json
└── README.md
```

---

## 🔌 API Endpoints Reference

### 1. Authentication (`/api/auth`)
*   `POST /register` - Registers username, email, password, and public/private key vault.
*   `POST /login` - Authenticates password and returns user profile + encrypted private key.
*   `POST /logout` - Clears refresh tokens and session cookies.
*   `POST /refresh` - Issues a fresh transient Access Token using the HttpOnly Refresh Token cookie.
*   `POST /resend-verification` - Dispatches another email verification link.
*   `GET /verify-email` - Validates email token and sets user status as active.
*   `POST /forget-password` - Emails a temporary password reset link valid for 5 minutes.

### 2. User & System (`/api/auth` under user context)
*   `GET /getme` - Retrieves the active user profile and vault parameters.
*   `PATCH /updateusername` - Updates user profile details.
*   `GET /get-sessions` - Lists active sessions and browser fingerprinted devices.
*   `GET /get-all-users` - Fetches all registered users' public keys for chat mapping.

### 3. Messaging & History (`/api/chat`)
*   `GET /history/:userId` - Fetches the encrypted historical message log with a specific user.
*   `GET /conversations` - Aggregates active chats for the current user's sidebar.
