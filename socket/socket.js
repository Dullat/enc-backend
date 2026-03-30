// socket/socket.js
require("dotenv").config();
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const Message = require("../models/message.model.js");
const Conversation = require("../models/conversation.model.js");

const userSocketMap = new Map(); // { userId: Set([socketId1, socketId2]) }

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Auth Connection
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      if (!cookies.accessToken) return next(new Error("No token"));

      const decoded = jwt.verify(
        cookies.accessToken,
        process.env.JWT_ACCESS_SECRET,
      );
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const senderId = socket.user._id;

    // Track active socket IDs(users) for each user
    if (!userSocketMap.has(senderId)) {
      userSocketMap.set(senderId, new Set());
    }
    userSocketMap.get(senderId).add(socket.id);

    // Online status
    const emitOnlineUsers = () => {
      io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
    };

    emitOnlineUsers();

    // chat listener
    socket.on("sendMessage", async (payload, callback) => {
      try {
        const {
          receiverId,
          encryptedContent,
          iv,
          receiverEncryptedKey,
          senderEncryptedKey,
        } = payload;

        // Save message to MongoDb
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          encryptedContent,
          iv,
          receiverEncryptedKey,
          senderEncryptedKey,
          status: "sent",
        });

        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, receiverId],
            lastMessage: newMessage._id,
          });
        } else {
          conversation.lastMessage = newMessage._id;
          await conversation.save();
        }

        // Deliver to receiver
        const receiverSocketIds = userSocketMap.get(receiverId);
        if (receiverSocketIds) {
          receiverSocketIds.forEach((id) => {
            io.to(id).emit("receiveMessage", newMessage);
          });
        }

        // Deliver to senders other tabs
        const senderSocketIds = userSocketMap.get(senderId);
        if (senderSocketIds) {
          senderSocketIds.forEach((id) => {
            if (id !== socket.id) {
              io.to(id).emit("receiveMessage", newMessage);
            }
          });
        }

        // Ack for current sender
        callback({ success: true, message: newMessage });
      } catch (error) {
        console.error("Socket Send Message Error:", error);
        callback({ success: false, error: "Failed to send message" });
      }
    });

    // Remove from Map on disconnect
    socket.on("disconnect", () => {
      const userSockets = userSocketMap.get(senderId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketMap.delete(senderId);
        }
      }
      emitOnlineUsers();
    });
  });

  return io;
};

module.exports = { initializeSocket, userSocketMap };
