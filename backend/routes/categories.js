const express = require("express");
const db = require("../config/db");
const requireAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Create category
router.post("/", requireAdmin, async (req, res) => {
    try {
        const { name, slug, parent_id } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                message: "Name and slug are required"
            });
        }

        // Check duplicate slug
        const [existing] = await db.query(
            "SELECT id FROM categories WHERE slug = ?",
            [slug]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: "Category slug already exists"
            });
        }

        // Check parent category if provided
        if (parent_id !== null && parent_id !== undefined) {
            const [parent] = await db.query(
                "SELECT id FROM categories WHERE id = ?",
                [parent_id]
            );

            if (parent.length === 0) {
                return res.status(400).json({
                    message: "Parent category does not exist"
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO categories (name, slug, parent_id)
             VALUES (?, ?, ?)`,
            [name, slug, parent_id || null]
        );

        res.status(201).json({
            message: "Category created successfully",
            categoryId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// Get all categories
router.get("/", requireAdmin, async (req, res) => {
    try {
        const [categories] = await db.query(
            `SELECT id, name, slug, parent_id, active
             FROM categories
             ORDER BY id ASC`
        );

        res.json(categories);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// Update category
router.patch("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, parent_id, active } = req.body;

        // Check if category exists
        const [categories] = await db.query(
            "SELECT id, parent_id FROM categories WHERE id = ?",
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        // Check duplicate slug
        if (slug) {
            const [existing] = await db.query(
                "SELECT id FROM categories WHERE slug = ? AND id != ?",
                [slug, id]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    message: "Category slug already exists"
                });
            }
        }

        // Validate parent category and prevent hierarchy cycles
if (parent_id !== null && parent_id !== undefined) {

    // A category cannot be its own parent
    if (Number(parent_id) === Number(id)) {
        return res.status(400).json({
            message: "A category cannot be its own parent"
        });
    }

    // Check that the parent exists
    const [parent] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [parent_id]
    );

    if (parent.length === 0) {
        return res.status(400).json({
            message: "Parent category does not exist"
        });
    }

    // Check whether the selected parent is a descendant
    // of the category being updated.
    let currentParentId = parent_id;

    while (currentParentId !== null) {

        if (Number(currentParentId) === Number(id)) {
            return res.status(400).json({
                message: "Category hierarchy cycle is not allowed"
            });
        }

        const [parentRows] = await db.query(
            "SELECT parent_id FROM categories WHERE id = ?",
            [currentParentId]
        );

        if (parentRows.length === 0) {
            break;
        }

        currentParentId = parentRows[0].parent_id;
    }
}

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

        if (parent_id !== undefined) {
            updates.push("parent_id = ?");
            values.push(parent_id);
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
            `UPDATE categories
             SET ${updates.join(", ")}
             WHERE id = ?`,
            values
        );

        res.json({
            message: "Category updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});
// Deactivate category
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [categories] = await db.query(
            "SELECT id FROM categories WHERE id = ?",
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        await db.query(
            "UPDATE categories SET active = FALSE WHERE id = ?",
            [id]
        );

        res.json({
            message: "Category deactivated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;