require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

// #### --------- Importing Errors ---------- ####
const errorHandler = require("./middleware/errorhandler.middleware");
const { NotFound } = require("./errors/Errors.error");

// #### --------- Importing Routers --------- ####
const userRouter = require("./routes/user.routes.js");
const encRouter = require("./routes/enc.routes.js");

// #### ------------ SSR -------------------- ####

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// #### ---------------- USE -----------------####
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/auth", userRouter);
app.use("/", encRouter);

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
