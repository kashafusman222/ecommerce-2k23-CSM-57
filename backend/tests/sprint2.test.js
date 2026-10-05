const request = require("supertest");
const db = require("../config/db");
const app = require("../server");

describe("Sprint 2 - Catalog API", () => {
    let token;

    const testSlug = `test-product-${Date.now()}`;
    const testSku = `TEST-SKU-${Date.now()}`;

    let testCategoryId;
    let testChildCategoryId;
    let testProductId;
    let testVariantId;
    let testSkuId;

    beforeAll(async () => {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error(
                "ADMIN_EMAIL and ADMIN_PASSWORD must be present in .env"
            );
        }

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password
            });

        expect(loginResponse.statusCode).toBe(200);

        token = loginResponse.body.token;
    });

    test("rejects unauthorized product access", async () => {
        const response = await request(app)
            .get("/api/v1/admin/products");

        expect(response.statusCode).toBe(401);
    });

    test("rejects unauthorized category access", async () => {
        const response = await request(app)
            .get("/api/v1/admin/categories");

        expect(response.statusCode).toBe(401);
    });
    test("rejects unauthorized product creation", async () => {
    const response = await request(app)
        .post("/api/v1/admin/products")
        .send({
            name: "Unauthorized Product",
            slug: `unauthorized-product-${Date.now()}`,
            description: "This product should not be created",
            status: "draft",
            category_id: 1
        });

    expect(response.statusCode).toBe(401);
});

    test("creates a test category", async () => {
        const response = await request(app)
            .post("/api/v1/admin/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: `Test Category ${Date.now()}`,
                slug: `test-category-${Date.now()}`
            });

        expect(response.statusCode).toBe(201);

        testCategoryId = response.body.categoryId;
        expect(testCategoryId).toBeDefined();
    });

    test("creates a child category", async () => {
        const response = await request(app)
            .post("/api/v1/admin/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: `Test Child ${Date.now()}`,
                slug: `test-child-${Date.now()}`,
                parent_id: testCategoryId
            });

        expect(response.statusCode).toBe(201);

        testChildCategoryId = response.body.categoryId;
        expect(testChildCategoryId).toBeDefined();
    });

    test("prevents category hierarchy cycle", async () => {
        const response = await request(app)
            .patch(`/api/v1/admin/categories/${testCategoryId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                parent_id: testChildCategoryId
            });

        expect(response.statusCode).toBe(400);
    });
test("creates a product with required fields", async () => {
    const response = await request(app)
        .post("/api/v1/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: `Test Product ${Date.now()}`,
            slug: testSlug,
            description: "Automated Sprint 2 test product",
            status: "draft",
            category_id: testCategoryId
        });

    expect(response.statusCode).toBe(201);

    testProductId = response.body.productId;
    expect(testProductId).toBeDefined();
});

test("rejects publishing a product without a sellable SKU", async () => {
    const response = await request(app)
        .patch(`/api/v1/admin/products/${testProductId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            status: "published"
        });

    expect(response.statusCode).toBe(400);
});

    test("rejects duplicate product slug", async () => {
        const response = await request(app)
            .post("/api/v1/admin/products")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Duplicate Test Product",
                slug: testSlug,
                description: "Duplicate slug test",
                status: "draft",
                category_id: testCategoryId
            });

        expect(response.statusCode).toBe(409);
    });

    test("creates a variant for the test product", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/variants`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                option_values: {
                    format: "Paperback"
                },
                option_signature: "format:Paperback"
            });

        expect(response.statusCode).toBe(201);

        testVariantId = response.body.variantId;
        expect(testVariantId).toBeDefined();
    });

    test("rejects duplicate variant combination", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/variants`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                option_values: {
                    format: "Paperback"
                },
                option_signature: "format:Paperback"
            });

        expect(response.statusCode).toBe(409);
    });

    test("creates a SKU with valid stock", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/skus`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                variant_id: testVariantId,
                sku_code: testSku,
                price: 1500,
                stock_quantity: 10,
                active: true
            });

        expect(response.statusCode).toBe(201);

        testSkuId = response.body.skuId;
        expect(testSkuId).toBeDefined();
    });

    test("rejects duplicate SKU code", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/skus`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                variant_id: testVariantId,
                sku_code: testSku,
                price: 1500,
                stock_quantity: 10,
                active: true
            });

        expect(response.statusCode).toBe(409);
    });

    test("rejects negative price", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/skus`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                variant_id: testVariantId,
                sku_code: `NEGATIVE-PRICE-${Date.now()}`,
                price: -100,
                stock_quantity: 5,
                active: true
            });

        expect(response.statusCode).toBe(400);
    });

    test("rejects negative stock", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/skus`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                variant_id: testVariantId,
                sku_code: `NEGATIVE-STOCK-${Date.now()}`,
                price: 1500,
                stock_quantity: -1,
                active: true
            });

        expect(response.statusCode).toBe(400);
    });

    test("rejects invalid active value", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/skus`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                variant_id: testVariantId,
                sku_code: `INVALID-ACTIVE-${Date.now()}`,
                price: 1500,
                stock_quantity: 5,
                active: "yes"
            });

        expect(response.statusCode).toBe(400);
    });

    test("rejects invalid variant for product SKU", async () => {
        const response = await request(app)
            .post(`/api/v1/admin/products/${testProductId}/skus`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                variant_id: 999999,
                sku_code: `INVALID-VARIANT-${Date.now()}`,
                price: 1500,
                stock_quantity: 5,
                active: true
            });

        expect(response.statusCode).toBe(400);
    });

    test("updates SKU stock successfully", async () => {
        const response = await request(app)
            .patch(`/api/v1/admin/skus/${testSkuId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                stock_quantity: 15
            });

        expect(response.statusCode).toBe(200);
    });

    afterAll(async () => {
        if (testSkuId) {
            await db.query(
                "DELETE FROM skus WHERE id = ?",
                [testSkuId]
            );
        }

        if (testVariantId) {
            await db.query(
                "DELETE FROM variants WHERE id = ?",
                [testVariantId]
            );
        }

        if (testProductId) {
            await db.query(
                "DELETE FROM products WHERE id = ?",
                [testProductId]
            );
        }

        if (testChildCategoryId) {
            await db.query(
                "DELETE FROM categories WHERE id = ?",
                [testChildCategoryId]
            );
        }

        if (testCategoryId) {
            await db.query(
                "DELETE FROM categories WHERE id = ?",
                [testCategoryId]
            );
        }

        await db.end();
    });
});