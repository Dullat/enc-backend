const express = require("express");
const app = express();

// #### Importing Errors ####
const errorHandler = require("./middleware/errorhandler.middleware");
const { NotFound } = require("./errors/Errors.error");

app.get("/", (req, res) => {
  res.send("hi there, im here");
});

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
