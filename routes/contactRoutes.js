const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const {
  submitContact,
  getAllContacts,
  markContactRead,
  deleteContact,
} = require("../controllers/contactController");

// PUBLIC
router.post("/contact", submitContact);

// ADMIN
router.get("/admin/contacts", adminAuth, getAllContacts);
router.put("/admin/contacts/:id/read", adminAuth, markContactRead);
router.delete("/admin/contacts/:id", adminAuth, deleteContact);

module.exports = router;
