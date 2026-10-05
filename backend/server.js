const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const variantRoutes = require("./routes/variants");
const skuRoutes = require("./routes/skus");
const productSkuRoutes = require("./routes/productskus");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/v1/admin/categories", categoryRoutes);
app.use("/api/v1/admin/products", productRoutes);
app.use("/api/v1/admin/products", variantRoutes);
app.use("/api/v1/admin/variants", skuRoutes);
app.use("/api/v1/admin/skus", skuRoutes);
app.use("/api/v1/admin/products", productSkuRoutes);



app.get("/", (req, res) => {
    res.json({
        message: "PagesNProse E-Commerce API is running"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            status: "OK",
            database: "Connected"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            database: "Not connected"
        });
    }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`PagesNProse API running on http://localhost:${PORT}`);
    });
}

module.exports = app;