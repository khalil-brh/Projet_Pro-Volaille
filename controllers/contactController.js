const Contact = require("../models/Contact");
const Notification = require("../models/Notification");
const socket = require("../socket");

// PUBLIC: Submit a contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, company, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const contact = await Contact.create({
      name,
      company,
      email,
      phone,
      message,
    });

    // Notify admins
    const notification = await Notification.create({
      type: "new_contact",
      message: company ? `Nouveau message de ${name} (${company})` : `Nouveau message de ${name}`,
    });

    const io = socket.getIO();
    io.emit("new_notification", notification);

    res.status(201).json({ message: "Message envoyé avec succès", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Get all contacts (paginated + search)
exports.getAllContacts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || "";

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Mark contact as read
exports.markContactRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    );

    if (!contact) {
      return res.status(404).json({ message: "Message non trouvé" });
    }

    res.json({ message: "Marqué comme lu", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: Delete contact
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Message supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
