const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const key = crypto.scryptSync("senin-sifren-burada-zyp", "salt", 32);
const iv = Buffer.alloc(16, 0);

module.exports = {
    encrypt: (text) => {
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        return encrypted;
    },
    decrypt: (encrypted) => {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
};
