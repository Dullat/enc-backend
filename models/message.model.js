const mongoose = require("mongoose");
// archi is based on how whatssppa and telegram's archi and sysDesign

// plan: 1. gen a random aes key
//       2. encrypt the message using aes key
//       3. now encrypt aes key twice using sender's and reciver's public key
//       4. why this: so that they can decypt the aes key using their private keys
//       and then use the key to decrypt the message

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // actual chat message
    encryptedContent: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    // im using these enc keys coz these will allow both sernder and reciver to decrypt messages
    // sender can see what he has sent and reciver can see what he has recived
    // temp aes key, encrypted using reciver's RSA public key
    receiverEncryptedKey: {
      type: String,
      required: true,
    },
    // temp aes key, encrypted using sender's RSA public key
    senderEncryptedKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true },
);

// Index: an index to make fetching chat history lightning fast, i wanna load like whatsapp
messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("Message", messageSchema);
