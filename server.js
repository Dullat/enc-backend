const app = require("./app");
const mongoDb = require("./db/connectDb");

const start = async () => {
  try {
    await mongoDb();
    app.listen(5000, () => {
      console.log("Server is runing on port 5000\nVisit http://localhost:5000");
    });
  } catch (err) {
    console.log(err);
  }
};

start();
