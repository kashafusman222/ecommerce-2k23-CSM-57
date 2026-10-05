const express = require("express");
const db = require("../config/db");
const requireAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Create product
router.post("/", requireAdmin, async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            status,
            category_id
        } = req.body;

        // Required fields
        if (!name || !slug || !category_id) {
            return res.status(400).json({
                message: "Name, slug and category_id are required"
            });
        }

        // Validate status
        const allowedStatuses = ["draft", "published", "inactive"];
        const productStatus = status || "draft";

        if (!allowedStatuses.includes(productStatus)) {
            return res.status(400).json({
                message: "Invalid product status"
            });
        }

        // New products must start as drafts
        if (productStatus === "published") {
            return res.status(400).json({
                message: "A new product must be created as draft before it can be published"
            });
        }

        // Check duplicate slug
        const [existingProduct] = await db.query(
            "SELECT id FROM products WHERE slug = ?",
            [slug]
        );

        if (existingProduct.length > 0) {
            return res.status(409).json({
                message: "Product slug already exists"
            });
        }

        // Check category exists
        const [category] = await db.query(
            "SELECT id FROM categories WHERE id = ?",
            [category_id]
        );

        if (category.length === 0) {
            return res.status(400).json({
                message: "Category does not exist"
            });
        }

        // Create product
        const [result] = await db.query(
            `INSERT INTO products
            (category_id, name, slug, description, status)
            VALUES (?, ?, ?, ?, ?)`,
            [
                category_id,
                name,
                slug,
                description || null,
                productStatus
            ]
        );

        res.status(201).json({
            message: "Product created successfully",
            productId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// Get all products
router.get("/", requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query(
            `SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.status,
                p.category_id,
                c.name AS category_name
             FROM products p
             LEFT JOIN categories c
                ON p.category_id = c.id
             ORDER BY p.id ASC`
        );

        res.json(products);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// Update product
router.patch("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            slug,
            description,
            status,
            category_id
        } = req.body;

        // Check product exists
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ?",
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Validate status
        const allowedStatuses = ["draft", "published", "inactive"];

        if (
            status !== undefined &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid product status"
            });
        }

        // A product can only be published when it has
        // at least one active SKU with available stock.
        if (status === "published") {
            const [sellableSkus] = await db.query(
                `SELECT s.id
                 FROM skus s
                 INNER JOIN variants v
                    ON s.variant_id = v.id
                 WHERE v.product_id = ?
                   AND s.active = TRUE
                   AND s.stock_quantity > 0
                 LIMIT 1`,
                [id]
            );

            if (sellableSkus.length === 0) {
                return res.status(400).json({
                    message:
                        "A product must have at least one active SKU with available stock before it can be published"
                });
            }
        }

        // Check duplicate slug
        if (slug !== undefined) {
            const [existingProduct] = await db.query(
                `SELECT id
                 FROM products
                 WHERE slug = ?
                 AND id != ?`,
                [slug, id]
            );

            if (existingProduct.length > 0) {
                return res.status(409).json({
                    message: "Product slug already exists"
                });
            }
        }

        // Check category
        if (category_id !== undefined) {
            if (category_id === null) {
                return res.status(400).json({
                    message: "category_id cannot be null"
                });
            }

            const [category] = await db.query(
                "SELECT id FROM categories WHERE id = ?",
                [category_id]
            );

            if (category.length === 0) {
                return res.status(400).json({
                    message: "Category does not exist"
                });
            }
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
        }

        if (slug !== undefined) {
            updates.push("slug = ?");
            values.push(slug);
        }

        if (description !== undefined) {
            updates.push("description = ?");
            values.push(description);
        }

        if (status !== undefined) {
            updates.push("status = ?");
            values.push(status);
        }

        if (category_id !== undefined) {
            updates.push("category_id = ?");
            values.push(category_id);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                message: "No fields provided for update"
            });
        }

        values.push(id);

        await db.query(
            `UPDATE products
             SET ${updates.join(", ")}
             WHERE id = ?`,
            values
        );

        res.json({
            message: "Product updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// Deactivate product
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check product exists
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ?",
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Soft deactivate the product
        await db.query(
            "UPDATE products SET status = 'inactive' WHERE id = ?",
            [id]
        );

        res.json({
            message: "Product deactivated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;