const express = require("express");
const db = require("../config/db");
const requireAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Create variant
router.post("/:productId/variants", requireAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        const { option_values, option_signature } = req.body;

        if (!option_values || !option_signature) {
            return res.status(400).json({
                message: "option_values and option_signature are required"
            });
        }

        // Check whether product exists
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ?",
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Check for duplicate variant combination
        const [existingVariant] = await db.query(
            `SELECT id
             FROM variants
             WHERE product_id = ? AND option_signature = ?`,
            [productId, option_signature]
        );

        if (existingVariant.length > 0) {
            return res.status(409).json({
                message: "Variant combination already exists"
            });
        }

        const [result] = await db.query(
            `INSERT INTO variants
             (product_id, option_values, option_signature)
             VALUES (?, ?, ?)`,
            [
                productId,
                JSON.stringify(option_values),
                option_signature
            ]
        );

        res.status(201).json({
            message: "Variant created successfully",
            variantId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// Get variants for a product
router.get("/:productId/variants", requireAdmin, async (req, res) => {
    try {
        const { productId } = req.params;

        const [variants] = await db.query(
            `SELECT
                id,
                product_id,
                option_values,
                option_signature,
                created_at
             FROM variants
             WHERE product_id = ?
             ORDER BY id ASC`,
            [productId]
        );

        res.json(variants);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;