const CustomError = require("./Custom.error.js");

class BadRequest extends CustomError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

class Unauthorized extends CustomError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class Forbidden extends CustomError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

class NotFound extends CustomError {
  constructor(message = "Page Not Found") {
    super(message, 404);
  }
}

class InternalServer extends CustomError {
  constructor(message) {
    super(message, 500);
  }
}

class Conflict extends CustomError {
  // email, file, username or key already exist
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

class UnprocessableEntity extends CustomError {
  // invalid file format , invalid enc, and week password
  constructor(message = "Validation failed") {
    super(message, 422);
  }
}

class TooManyRequests extends CustomError {
  // rate limit, login bruteforce
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

class EncryptionError extends CustomError {
  // enc failed
  constructor(message = "Encryption failed") {
    super(message, 500);
  }
}

class InvalidKeyError extends CustomError {
  // invalid enc key
  constructor(message = "Invalid encryption key") {
    super(message, 422);
  }
}

module.exports = {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  InternalServer,
  Conflict,
  UnprocessableEntity,
  TooManyRequests,
  EncryptionError,
  InvalidKeyError,
};
