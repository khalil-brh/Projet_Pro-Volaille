const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
    createUser,
    getUsers,
    updateUser,
    updateMyProfile,
    deleteUser
} = require("../controllers/userController");

const { userLogin, getMe, verifyEmail, resendVerificationEmail } = require("../controllers/authController");
const { getUserNotifications, markUserNotificationRead } = require("../controllers/notificationController");
const userAuth = require("../middleware/userAuth");


router.post("/users", upload.array("files", 5), createUser);

router.post("/users/login", userLogin);
router.post("/users/verify-email", verifyEmail);
router.post("/users/resend-verification-email", resendVerificationEmail);

router.get("/users/me", getMe);
router.put("/users/me", userAuth, updateMyProfile);

router.get("/users/me/notifications", userAuth, getUserNotifications);
router.put("/users/me/notifications/:id/read", userAuth, markUserNotificationRead);

router.get("/users", getUsers);

router.put("/users/:id", updateUser);

router.delete("/users/:id", deleteUser);


module.exports = router;
