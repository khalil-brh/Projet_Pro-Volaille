const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const contactRoutes = require("./routes/contactRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const socket = require("./socket");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socket.init(server);

// Middleware (BEFORE routes)
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// App routes
app.use("/api", userRoutes);
app.use("/api", adminRoutes);
app.use("/api", productRoutes);
app.use("/api", contactRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);

server.listen(process.env.PORT || 5001, () => {
    console.log(`Server running on port ${process.env.PORT || 5001}`);
});
