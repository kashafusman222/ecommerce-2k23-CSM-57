const express = require("express");
const db = require("../config/db");
const requireAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Create SKU
router.post("/:variantId/skus", requireAdmin, async (req, res) => {
    try {
        const { variantId } = req.params;
        const {
            sku_code,
            price,
            stock_quantity,
            active
        } = req.body;

        if (!sku_code || price === undefined || stock_quantity === undefined) {
            return res.status(400).json({
                message: "sku_code, price and stock_quantity are required"
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({
        message: "Price must be a non-negative number"
    });
}

        if (!Number.isInteger(Number(stock_quantity)) || Number(stock_quantity) < 0) {
            return res.status(400).json({
                message: "Stock quantity must be a non-negative integer"
            });
        }
        if (active !== undefined && typeof active !== "boolean") {
    return res.status(400).json({
        message: "Active must be true or false"
    });
}

        const [variants] = await db.query(
            "SELECT id FROM variants WHERE id = ?",
            [variantId]
        );

        if (variants.length === 0) {
            return res.status(404).json({
                message: "Variant not found"
            });
        }

        const [existingSku] = await db.query(
            "SELECT id FROM skus WHERE sku_code = ?",
            [sku_code]
        );

        if (existingSku.length > 0) {
            return res.status(409).json({
                message: "SKU code already exists"
            });
        }

        const [result] = await db.query(
            `INSERT INTO skus
            (variant_id, sku_code, price, stock_quantity, active)
            VALUES (?, ?, ?, ?, ?)`,
            [
                variantId,
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

// Get all SKUs for a variant
router.get("/:variantId/skus", requireAdmin, async (req, res) => {
    try {
        const { variantId } = req.params;

        const [skus] = await db.query(
            `SELECT
                id,
                variant_id,
                sku_code,
                price,
                stock_quantity,
                active,
                created_at,
                updated_at
             FROM skus
             WHERE variant_id = ?
             ORDER BY id ASC`,
            [variantId]
        );

        res.json(skus);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});
// Update SKU
router.patch("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            sku_code,
            price,
            stock_quantity,
            active
        } = req.body;

        const [skus] = await db.query(
            "SELECT id FROM skus WHERE id = ?",
            [id]
        );

        if (skus.length === 0) {
            return res.status(404).json({
                message: "SKU not found"
            });
        }

        if (price !== undefined && Number(price) < 0) {
            return res.status(400).json({
                message: "Price cannot be negative"
            });
        }

        if (
            stock_quantity !== undefined &&
            (!Number.isInteger(Number(stock_quantity)) ||
                Number(stock_quantity) < 0)
        ) {
            return res.status(400).json({
                message: "Stock quantity must be a non-negative integer"
            });
        }

        if (sku_code !== undefined) {
            const [existingSku] = await db.query(
                "SELECT id FROM skus WHERE sku_code = ? AND id != ?",
                [sku_code, id]
            );

            if (existingSku.length > 0) {
                return res.status(409).json({
                    message: "SKU code already exists"
                });
            }
        }

        const updates = [];
        const values = [];

        if (sku_code !== undefined) {
            updates.push("sku_code = ?");
            values.push(sku_code);
        }

        if (price !== undefined) {
            updates.push("price = ?");
            values.push(price);
        }

        if (stock_quantity !== undefined) {
            updates.push("stock_quantity = ?");
            values.push(stock_quantity);
        }

        if (active !== undefined) {
            updates.push("active = ?");
            values.push(active);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                message: "No fields provided for update"
            });
        }

        values.push(id);

        await db.query(
            `UPDATE skus
             SET ${updates.join(", ")}
             WHERE id = ?`,
            values
        );

        res.json({
            message: "SKU updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;