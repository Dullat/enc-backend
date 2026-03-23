// womp womp, wasted time, its not gonna work , it only works in postman
// the approach i used was full-duplex. but browsers are half duplex, so it causes tcp-deadLock
// fetch wont let read incomming stream untill upload strean is 100% done
// so , i have to drop this idea, i may use socket.io or webCrypto api insted
const Busboy = require("busboy");
const crypto = require("crypto");
const path = require("path");
const { PassThrough } = require("stream");

const {
  BadRequest,
  InternalServer,
  Unauthorized,
} = require("../errors/Errors.error.js");

const encryptAndDownloadDirect = async (req, res, next) => {
  try {
    const encryptionPassword = req.headers["x-password"];
    if (!encryptionPassword) {
      throw new BadRequest("No password provided");
    }
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
    });

    let fileProcessed = false;

    busboy.on("file", (fieldname, fileStream, info) => {
      fileProcessed = true;

      const safeName = path.basename(info.filename);

      const salt = crypto.randomBytes(16);
      const key = crypto.pbkdf2Sync(
        encryptionPassword,
        salt,
        100000,
        32,
        "sha256",
      );
      const iv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="enc_${safeName}.enc"`,
      );

      res.write(salt);
      res.write(iv);

      fileStream.pipe(cipher).pipe(res, { end: false });

      cipher.on("end", () => {
        console.log("File encrypted succesfully");
        const authTag = cipher.getAuthTag();
        res.end(authTag);
      });

      fileStream.on("limit", () => {
        fileStream.unpipe(cipher);
        cipher.unpipe(res);
        res.destroy();
        req.destroy();
      });
    });

    busboy.on("finish", () => {
      if (!fileProcessed) {
        next(new BadRequest("No file was uploaded"));
      }
    });

    busboy.on("error", (err) => {
      next(new InternalServer("Stream processing failed"));
    });

    req.pipe(busboy);
  } catch (err) {
    next(err);
  }
};

module.exports = { encryptAndDownloadDirect };
