const express = require("express");

const app = express();

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

module.exports = app;
