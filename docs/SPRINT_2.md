# Sprint 2 — Catalog & Admin API

## 1. Sprint Goal and Scope

### Sprint Goal

The goal of Sprint 2 is to implement the core catalog management system for PagesNProse, an online bookstore. This sprint focuses on creating and managing categories, products, product variants, and SKUs through authenticated admin APIs.

The sprint also establishes database integrity rules, administrator authorization, seed data, and automated tests so that the catalog data remains valid and reproducible.

### In Scope

- Category creation, listing, updating, and deactivation
- Parent-child category hierarchy
- Product creation, listing, updating, and deactivation
- Product variants and valid option combinations
- SKU creation and updating
- SKU price and stock validation
- Unique category slugs
- Unique product slugs
- Unique SKU codes
- Prevention of duplicate product variant combinations
- Admin authentication and authorization
- Reproducible catalog seed data
- Automated API tests
- Database integrity constraints

### Out of Scope

The following features are intentionally not implemented in Sprint 2:

- Public catalog search
- Asset uploading
- Dynamic specification management
- Payment processing
- Checkout
- Order processing
- Shipping
- Publication workflow automation

These features can be addressed in later sprints.

## 2. Integration with Sprint 1

Sprint 2 continues the architecture and data-model decisions established in Sprint 1.

The project remains an online bookstore named PagesNProse. The selected technology stack is:
Frontend: React
Backend: Node.js with Express
Database: MySQL

Sprint 2 extends the Sprint 1 database model by implementing the catalog management portion of the system.

The existing entities for users, carts, cart items, orders, and order items are retained for future ecommerce functionality. Sprint 2 mainly implements the catalog entities required to manage books and their sellable variants.

Sprint 1 documentation:
[View Sprint 1](./sprint_1.md)

## 3. Updated Data Model

### 3.1 Entity Relationship Diagram

The Sprint 2 data model extends the Sprint 1 ecommerce structure by adding the catalog entities required for product management.

```mermaid
erDiagram

    USERS ||--o| CARTS : has
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : added_to

    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    SKUS ||--o{ ORDER_ITEMS : included_in

    CATEGORIES ||--o{ CATEGORIES : contains
    CATEGORIES ||--o{ PRODUCTS : classifies

    PRODUCTS ||--o{ VARIANTS : has
    VARIANTS ||--o{ SKUS : has
    PRODUCTS ||--o{ ASSETS : has

    USERS {
        INT id PK
    }

    CATEGORIES {
        INT id PK
        INT parent_id FK
        VARCHAR name
        VARCHAR slug UK
        BOOLEAN active
    }

    PRODUCTS {
        INT id PK
        INT category_id FK
        VARCHAR name
        VARCHAR slug UK
        TEXT description
        VARCHAR status
        JSON specifications
    }

    VARIANTS {
        INT id PK
        INT product_id FK
        JSON option_values
        VARCHAR option_signature
    }

    SKUS {
        INT id PK
        INT variant_id FK
        VARCHAR sku_code UK
        DECIMAL price
        INT stock_quantity
        BOOLEAN active
    }

    ASSETS {
        INT id PK
        INT product_id FK
        VARCHAR storage_key
        VARCHAR role
        VARCHAR alt_text
        INT sort_order
    }

    CARTS {
        INT id PK
        INT user_id FK
    }

    CART_ITEMS {
        INT id PK
        INT cart_id FK
        INT product_id FK
        INT quantity
    }

    ORDERS {
        INT id PK
        INT user_id FK
        DATETIME order_date
        DECIMAL total_amount
        VARCHAR status
        VARCHAR delivery_address
    }

    ORDER_ITEMS {
        INT id PK
        INT order_id FK
        INT sku_id FK
        INT quantity
        DECIMAL unit_price
    }

    ## 4. API Routes

All catalog write operations are protected by administrator authentication. Requests must include a valid JWT access token in the `Authorization` header.

### 4.1 Authentication

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate an administrator and issue a JWT |

### 4.2 Category Routes

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/v1/admin/categories` | Admin | Create a category |
| GET | `/api/v1/admin/categories` | Admin | List categories |
| PATCH | `/api/v1/admin/categories/:id` | Admin | Update a category |
| DELETE | `/api/v1/admin/categories/:id` | Admin | Deactivate a category |

### 4.3 Product Routes

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/v1/admin/products` | Admin | Create a product |
| GET | `/api/v1/admin/products` | Admin | List products |
| PATCH | `/api/v1/admin/products/:id` | Admin | Update a product |
| DELETE | `/api/v1/admin/products/:id` | Admin | Deactivate a product |

### 4.4 Variant Routes

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/v1/admin/products/:productId/variants` | Admin | Create a product variant |
| GET | `/api/v1/admin/products/:productId/variants` | Admin | List variants for a product |

### 4.5 SKU Routes

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/v1/admin/products/:productId/skus` | Admin | Create a SKU for a product variant |
| POST | `/api/v1/admin/variants/:variantId/skus` | Admin | Create a SKU for a variant |
| GET | `/api/v1/admin/variants/:variantId/skus` | Admin | List SKUs for a variant |
| PATCH | `/api/v1/admin/skus/:id` | Admin | Update a SKU |

### Example Authentication Header

```text
Authorization: Bearer <JWT_TOKEN>

## 5. Data Integrity and Business Rules

### Product Lifecycle

A new product is created with `draft` status.
A draft product may exist without a SKU.
A product can only be published when it has at least one active SKU with stock greater than zero.
An inactive product remains in the database and is not physically deleted.

### Category Hierarchy

Categories may have a parent category.
A category cannot be its own parent.
Category hierarchy cycles are rejected.
Category slugs must be unique.
Category deactivation is handled as a soft deactivation using the `active` field.
Existing product/category relationships are preserved.

### Variants

Each product may have multiple variants.
Each variant represents a valid option combination.
The same option combination cannot be created twice for the same product.
The database enforces uniqueness using `(product_id, option_signature)`.

### SKUs and Inventory

Each SKU belongs to a variant.
SKU codes must be globally unique.
SKU price must be non-negative.
Stock quantity must be a non-negative integer.
A SKU can be marked inactive when it is unavailable.
A SKU with zero stock is not considered sellable.

### Price Representation

SKU prices are stored using MySQL `DECIMAL(10,2)` instead of floating-point values to avoid floating-point precision problems when storing monetary values.

### Cart and Order Integrity

Cart item quantities must be greater than zero.
A product can appear only once per cart.
Order item quantities must be greater than zero.
Order item unit prices cannot be negative.
Order items reference SKUs so the purchased product variant is preserved.

 ## 6. Seed Data and Demo

### Seed Data

The Sprint 2 catalog seed provides demonstration data for the admin catalog.

The seed includes:

 At least two category levels.
 At least three products.
 Multiple variants for one product.
 At least four valid SKUs.
 A SKU with zero stock and inactive status to demonstrate an unavailable product combination.

The catalog can be seeded using:
```bash
npm run seed:catalog
```

### Admin API Demonstration

The following workflow demonstrates the main admin catalog operations:
1. Authenticate as an admin using /api/auth/login.
2. Create a category using POST /api/v1/admin/categories.
3. Create a product using POST /api/v1/admin/products.
4. Create a variant for the product.
5. Create a SKU for the variant.
6. Retrieve products using GET /api/v1/admin/products.
7. Retrieve categories using GET /api/v1/admin/categories.

All admin catalog routes require a valid admin Bearer token.


### Example Admin Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "<configured-admin-password>"
}
```

### Example successful response
```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>"
}
```

### Example Product Creation
```http
POST /api/v1/admin/products
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Example Book",
  "slug": "example-book",
  "description": "Example catalog product",
  "status": "draft",
  "category_id": 1
}
```

### Example response
```json
{
  "message": "Product created successfully",
  "productId": 1
}
```

### Example SKU Creation
```http
POST /api/v1/admin/products/1/skus
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "variant_id": 1,
  "sku_code": "EXAMPLE-BOOK-PB-001",
  "price": 1500,
  "stock_quantity": 10,
  "active": true
}
```

### Example response
```json
{
  "message": "SKU created successfully",
  "skuId": 1
}
```

## 7. Automated Testing

Sprint 2 uses Jest and Supertest for automated API testing.

### Test Coverage

The test suite verifies:
- Unauthorized access to admin product routes.
- Unauthorized access to admin category routes.
- Unauthorized product creation.
- Category creation.
- Child category creation.
- Category hierarchy cycle prevention.
- Product creation.
- Duplicate product slug rejection.
- Product publishing rejection when no sellable SKU exists.
- Variant creation.
- Duplicate variant combination rejection.
- Valid SKU creation.
- Duplicate SKU rejection.
- Negative price rejection.
- Negative stock rejection.
- Invalid SKU active value rejection.
- Invalid variant/product relationship rejection.
- SKU stock update.

### Test Command
Run:
npm test

Latest Test Result:
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total

## 8. Limitations and Sprint 3 Backlog

The following features are intentionally outside the Sprint 2 scope and can be addressed in later sprints:

- Public product catalog and customer-facing product browsing.
- Public catalog search and filtering.
- Customer shopping cart interface.
- Checkout and payment processing.
- Order placement and order management workflows.
- Shipping and delivery functionality.
- Product asset/image upload.
- Dynamic specification management.
- Full product publication workflow and moderation.
- Customer-facing authentication and account management.

Sprint 2 focuses on the admin catalog foundation, database integrity, product variants, SKUs, inventory rules, authentication, authorization, seed data, and automated testing.
