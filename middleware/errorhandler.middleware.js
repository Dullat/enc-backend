const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong...";

  // res.send(err.message);

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: err.stack,
  });
};

module.exports = errorHandler;
