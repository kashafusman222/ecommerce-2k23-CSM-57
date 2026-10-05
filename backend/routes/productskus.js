const express = require("express");
const db = require("../config/db");
const requireAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Create SKU for a product
router.post("/:productId/skus", requireAdmin, async (req, res) => {
    try {
        const { productId } = req.params;

        const {
            variant_id,
            sku_code,
            price,
            stock_quantity,
            active
        } = req.body;

        if (
            !variant_id ||
            !sku_code ||
            price === undefined ||
            stock_quantity === undefined
        ) {
            return res.status(400).json({
                message: "variant_id, sku_code, price and stock_quantity are required"
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                message: "Price must be a non-negative number"
            });
        }

        if (
            !Number.isInteger(Number(stock_quantity)) ||
            Number(stock_quantity) < 0
        ) {
            return res.status(400).json({
                message: "Stock quantity must be a non-negative integer"
            });
        }

        if (
            active !== undefined &&
            typeof active !== "boolean"
        ) {
            return res.status(400).json({
                message: "Active must be true or false"
            });
        }

        // Check product exists
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ?",
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Check variant exists and belongs to this product
        const [variants] = await db.query(
            `SELECT id
             FROM variants
             WHERE id = ? AND product_id = ?`,
            [variant_id, productId]
        );

        if (variants.length === 0) {
            return res.status(400).json({
                message: "Variant does not belong to this product"
            });
        }

        // Check SKU code is unique
        const [existingSku] = await db.query(
            "SELECT id FROM skus WHERE sku_code = ?",
            [sku_code]
        );

        if (existingSku.length > 0) {
            return res.status(409).json({
                message: "SKU code already exists"
            });
        }

        // Create SKU
        const [result] = await db.query(
            `INSERT INTO skus
            (variant_id, sku_code, price, stock_quantity, active)
            VALUES (?, ?, ?, ?, ?)`,
            [
                variant_id,
                sku_code,
                price,
                stock_quantity,
                active === undefined ? true : active
            ]
        );

        res.status(201).json({
            message: "SKU created successfully",
            skuId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;