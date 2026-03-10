const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
    createUser,
    getUsers,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const { userLogin } = require("../controllers/authController");


router.post("/users", upload.array("files", 5), createUser);

router.post("/users/login", userLogin);

router.get("/users", getUsers);

router.put("/users/:id", updateUser);

router.delete("/users/:id", deleteUser);


module.exports = router;
