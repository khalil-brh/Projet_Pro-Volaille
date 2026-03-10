const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Seuls les fichiers image et PDF sont autorisés"), false);
        }
    },
});

module.exports = upload;
