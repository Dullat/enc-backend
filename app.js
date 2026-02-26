const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

// #### --------- Importing Errors ---------- ####
const errorHandler = require("./middleware/errorhandler.middleware");
const { NotFound } = require("./errors/Errors.error");

// #### --------- Importing Routers --------- ####
const userRouter = require("./routes/user.routes.js");

// #### ---------------- USE -----------------####
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/", userRouter);

// #### --------- Status and Errors ---------####
app.get("/status", (req, res) => {
  res.status(200).json({
    service: "enc-backend",
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toString(),
  });
});

app.use((req, res, next) => {
  throw new NotFound();
});

app.use(errorHandler);

module.exports = app;
