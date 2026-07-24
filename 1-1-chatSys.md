# End-to-End Encrypted (E2EE) Chat System - Backend Documentation

This document explains the technical architecture, implementation details, and logic behind the E2EE chat system.

## 1. System Overview
The chat system follows a "Zero-Knowledge" architecture. The server facilitates message delivery but **cannot read the messages** because they are encrypted on the client side before transmission.

### Key Components:
- **Authentication:** JWT-based (Access & Refresh tokens).
- **Socket.io:** Real-time bidirectional communication.
- **E2EE (RSA + AES):** Cryptographic security for message content.
- **MongoDB:** Persistent storage for users, messages, and conversations.

---

## 2. Database Models

### User Model (`models/user.model.js`)
Stores user identity and their **public cryptographic vault**.
- `publicKey`: RSA Public Key (Base64) used by others to encrypt messages for this user.
- `encryptedPrivateKey`: User's RSA Private Key, encrypted with their password (AES-GCM).
- `keySalt` & `keyIv`: Parameters used to derive the AES key from the user's password.

### Message Model (`models/message.model.js`)
Stores the encrypted payloads.
- `sender` & `receiver`: References to User IDs.
- `encryptedContent`: The actual chat message encrypted with a random AES Session Key.
- `iv`: AES Initial Vector for the content.
- `receiverEncryptedKey`: The AES Session Key encrypted with the **receiver's** Public RSA Key.
- `senderEncryptedKey`: The AES Session Key encrypted with the **sender's** Public RSA Key.
- `status`: `sent`, `delivered`, or `read`.

### Conversation Model (`models/conversation.model.js`)
Tracks chat participants and the last message for sidebar previews.
- `participants`: Array of User IDs.
- `lastMessage`: Reference to the latest Message ID.

---

## 3. Real-time Logic (`socket/socket.js`)

The socket layer handles the delivery of messages and online status tracking.

### Multi-Session Support
We use a `Map` where the key is the `userId` and the value is a `Set` of `socketId`s.
```javascript
const userSocketMap = new Map(); // { userId: Set([socketId1, socketId2]) }
```
This allows a user to be logged in on multiple tabs/devices. When a message is sent, it is broadcast to **all** active sockets for that user.

### Connection Workflow
1. **Middleware:** Parses cookies to verify the JWT `accessToken`.
2. **Connection:** Adds the `socket.id` to the user's `Set` in `userSocketMap`.
3. **Status:** Emits `getOnlineUsers` (all keys in the Map).
4. **SendMessage:** 
   - Saves the encrypted payload to MongoDB.
   - Updates/Creates the `Conversation`.
   - Emits `receiveMessage` to the receiver's sockets.
   - Emits `receiveMessage` to the sender's **other** sockets (so all tabs stay in sync).

---

## 4. API Endpoints

### Auth Routes (`routes/user.routes.js`)
- `POST /register`: Accepts `publicKey`, `encryptedPrivateKey`, `keySalt`, `keyIv`.
- `POST /login`: Returns the user's vault so the frontend can unlock the private key.
- `GET /getme`: Returns the current user's data including vault parameters.
- `GET /get-all-users`: Returns a list of users with their `publicKey`s.

### Chat Routes (`routes/chat.routes.js`)
- `GET /history/:userId`: Fetches all messages between the logged-in user and the target user, sorted by `createdAt`.

---

## 5. Architectural Flow (The "WhatsApp" Way)

1. **User A** wants to message **User B**.
2. **User A** fetches **User B's** `publicKey`.
3. **User A** generates a random **AES Key** (Session Key).
4. **User A** encrypts the message with the **AES Key**.
5. **User A** encrypts the **AES Key** twice:
   - Once with **User B's** Public Key (so B can read it).
   - Once with **User A's** Public Key (so A can read it in history).
6. **User A** sends all 4 pieces (Encrypted Content, IV, 2 Encrypted AES Keys) to the server via Socket.
7. **Server** saves it to DB and pushes it to **User B**.
8. **User B** uses their **Private Key** to decrypt the **AES Key**, then uses that to decrypt the message.

---

## 6. Security Implementation Details
- **Encryption Algorithm:** RSA-OAEP (2048-bit) for key exchange.
- **Content Encryption:** AES-GCM (256-bit) for message body.
- **Key Derivation:** PBKDF2 with 100,000 iterations to derive the Master Key from the user's password.
- **Zero-Knowledge:** The server never sees the raw password or the raw Private Key.
