const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

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

app.listen(process.env.PORT || 5001, () => {
    console.log(`Server running on port ${process.env.PORT || 5001}`);
});
