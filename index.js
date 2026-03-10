const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const app = express();
app.use(express.json());
const cors = require("cors");


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// app routes
app.use("/api", userRoutes);
app.use("/api", adminRoutes);
app.use("/api", productRoutes);

app.use(cors());


app.listen(5001, () => {
    console.log("Server running on port 5001");
});