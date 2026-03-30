const app = require("./app");
const http = require("http");
const mongoDb = require("./db/connectDb");
const { initializeSocket } = require("./socket/socket.js");

const start = async () => {
  try {
    await mongoDb();
    const server = http.createServer(app);

    const io = initializeSocket(server);

    app.set("io", io);

    server.listen(5000, () => {
      console.log("Server is runing on port 5000\nVisit http://localhost:5000");
    });
  } catch (err) {
    console.log(err);
  }
};

start();
