const db = require("../../backend/config/db");

async function seedCatalog() {
    try {
        console.log("Starting catalog seed...");

        // -----------------------------
        // 1. Categories
        // -----------------------------

        let [categories] = await db.query(
            "SELECT id FROM categories WHERE slug = ?",
            ["fiction"]
        );

        let fictionId;

        if (categories.length === 0) {
            const [result] = await db.query(
                `INSERT INTO categories
                (name, slug, parent_id, active)
                VALUES (?, ?, ?, ?)`,
                ["Fiction", "fiction", null, true]
            );

            fictionId = result.insertId;
        } else {
            fictionId = categories[0].id;

            await db.query(
                `UPDATE categories
                 SET name = ?, parent_id = NULL, active = TRUE
                 WHERE id = ?`,
                ["Fiction", fictionId]
            );
        }

        [categories] = await db.query(
            "SELECT id FROM categories WHERE slug = ?",
            ["romance"]
        );

        let romanceId;

        if (categories.length === 0) {
            const [result] = await db.query(
                `INSERT INTO categories
                (name, slug, parent_id, active)
                VALUES (?, ?, ?, ?)`,
                ["Romantic Fiction", "romance", fictionId, true]
            );

            romanceId = result.insertId;
        } else {
            romanceId = categories[0].id;

            await db.query(
                `UPDATE categories
                 SET name = ?, parent_id = ?, active = TRUE
                 WHERE id = ?`,
                ["Romantic Fiction", fictionId, romanceId]
            );
        }

        console.log("Categories seeded.");

        // -----------------------------
        // 2. Products
        // -----------------------------

        const products = [
            {
                name: "The Midnight Library",
                slug: "the-midnight-library",
                description:
                    "A novel about choices, possibilities, and the different paths life can take.",
                status: "draft",
                categoryId: fictionId
            },
            {
                name: "The Seven Husbands of Evelyn Hugo",
                slug: "the-seven-husbands-of-evelyn-hugo",
                description:
                    "A novel about fame, love, secrets, and the life of a famous actress.",
                status: "published",
                categoryId: fictionId
            },
            {
                name: "It Ends with Us",
                slug: "it-ends-with-us",
                description:
                    "A contemporary romance novel exploring love, relationships, and difficult choices.",
                status: "published",
                categoryId: romanceId
            }
        ];

        const productIds = {};

        for (const product of products) {
            const [existing] = await db.query(
                "SELECT id FROM products WHERE slug = ?",
                [product.slug]
            );

            if (existing.length === 0) {
                const [result] = await db.query(
                    `INSERT INTO products
                    (name, slug, description, status, category_id)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        product.name,
                        product.slug,
                        product.description,
                        product.status,
                        product.categoryId
                    ]
                );

                productIds[product.slug] = result.insertId;
            } else {
                productIds[product.slug] = existing[0].id;

                await db.query(
                    `UPDATE products
                     SET name = ?,
                         description = ?,
                         status = ?,
                         category_id = ?
                     WHERE id = ?`,
                    [
                        product.name,
                        product.description,
                        product.status,
                        product.categoryId,
                        existing[0].id
                    ]
                );
            }
        }

        console.log("Products seeded.");

        // -----------------------------
        // 3. Variants
        // -----------------------------

        const variants = [
            {
                productSlug: "the-midnight-library",
                optionValues: { format: "Paperback" },
                signature: "format:Paperback"
            },
            {
                productSlug: "the-midnight-library",
                optionValues: { format: "Hardcover" },
                signature: "format:Hardcover"
            },
            {
                productSlug: "the-midnight-library",
                optionValues: { format: "Ebook" },
                signature: "format:Ebook"
            },
            {
                productSlug: "the-seven-husbands-of-evelyn-hugo",
                optionValues: { format: "Paperback" },
                signature: "format:Paperback"
            },
            {
                productSlug: "it-ends-with-us",
                optionValues: { format: "Paperback" },
                signature: "format:Paperback"
            }
        ];

        const variantIds = {};

        for (const variant of variants) {
            const productId = productIds[variant.productSlug];

            const [existing] = await db.query(
                `SELECT id
                 FROM variants
                 WHERE product_id = ?
                 AND option_signature = ?`,
                [productId, variant.signature]
            );

            if (existing.length === 0) {
                const [result] = await db.query(
                    `INSERT INTO variants
                    (product_id, option_values, option_signature)
                    VALUES (?, ?, ?)`,
                    [
                        productId,
                        JSON.stringify(variant.optionValues),
                        variant.signature
                    ]
                );

                variantIds[
                    `${variant.productSlug}-${variant.signature}`
                ] = result.insertId;
            } else {
                variantIds[
                    `${variant.productSlug}-${variant.signature}`
                ] = existing[0].id;
            }
        }

        console.log("Variants seeded.");

        // -----------------------------
        // 4. SKUs
        // -----------------------------

        const skus = [
            {
                productSlug: "the-midnight-library",
                signature: "format:Paperback",
                skuCode: "SKU-ML-PB-001",
                price: 1200,
                stock: 10,
                active: true
            },
            {
                productSlug: "the-midnight-library",
                signature: "format:Hardcover",
                skuCode: "SKU-ML-HC-001",
                price: 1800,
                stock: 5,
                active: true
            },
            {
                productSlug: "the-midnight-library",
                signature: "format:Ebook",
                skuCode: "SKU-ML-EB-001",
                price: 1300,
                stock: 0,
                active: false
            },
            {
                productSlug: "the-seven-husbands-of-evelyn-hugo",
                signature: "format:Paperback",
                skuCode: "SKU-EH-PB-001",
                price: 1500,
                stock: 8,
                active: true
            },
            {
                productSlug: "it-ends-with-us",
                signature: "format:Paperback",
                skuCode: "SKU-IEU-PB-001",
                price: 1400,
                stock: 9,
                active: true
            }
        ];

        for (const sku of skus) {
            const variantId =
                variantIds[`${sku.productSlug}-${sku.signature}`];

            const [existing] = await db.query(
                "SELECT id FROM skus WHERE sku_code = ?",
                [sku.skuCode]
            );

            if (existing.length === 0) {
                await db.query(
                    `INSERT INTO skus
                    (variant_id, sku_code, price, stock_quantity, active)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        variantId,
                        sku.skuCode,
                        sku.price,
                        sku.stock,
                        sku.active
                    ]
                );
            } else {
                await db.query(
                    `UPDATE skus
                     SET variant_id = ?,
                         price = ?,
                         stock_quantity = ?,
                         active = ?
                     WHERE sku_code = ?`,
                    [
                        variantId,
                        sku.price,
                        sku.stock,
                        sku.active,
                        sku.skuCode
                    ]
                );
            }
        }

        console.log("SKUs seeded.");

        console.log("Catalog seed completed successfully.");

    } catch (error) {
        console.error("Catalog seed failed:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

seedCatalog();