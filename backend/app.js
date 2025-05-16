const express = require("express");
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contact");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));