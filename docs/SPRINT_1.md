# Sprint 1: System Architecture & Scope Definition

Project: Pages & Prose —  Online Bookstore
Course: E-Commerce
Sprint: 1

## Section 1: Target Audience & Market Focus

### Primary Persona:
Retail consumers who read for leisure or study. students, working professionals, and casual readers aged 18–45 who want to browse and buy books online without visiting a physical store.

### Core Pain Point:
Readers may need to search multiple physical or online bookstores to find a particular book, compare prices, and determine whether it is currently available. This process can be time-consuming and inconvenient, especially when the desired book is not available at a nearby store.
The proposed system addresses this problem by providing a centralized online bookstore where customers can browse, search, filter, check book availability and prices, add books to a shopping cart, and place orders
online.

### Domain Scope:
Market Vertical: Books & Reading / Online Book Retail
The system focuses on the online sale of physical books. It will provide customers with access to categorized books and basic e-commerce functionality, while administrators will manage the book catalog and inventory.

## 2. Minimum Viable Product (MVP) Feature Scope

The MVP is limited to the core workflows required to operate a functional online bookstore within the academic project timeline.

| Category | Feature Name | Description | Priority |
|---|---|---|---|
| Authentication | User Registration & Login | Allows customers to create accounts and securely log in to the system. Authentication will use password hashing and JWT-based authentication. | High (MVP) |
| Catalog | Book Catalog & Search | Allows customers to browse books, search by title or author, filter by category, and view price and availability. | High (MVP) |
| Cart | Shopping Cart Management | Allows customers to add books to their cart, modify quantities, remove items, and view the current cart total. | High (MVP) |
| Checkout | Order Processing | Allows customers to provide delivery information, review their order, complete a mock checkout/payment process, and place an order. | High (MVP) |
| Administration | Book & Inventory Management | Allows administrators to add, update, and delete books and manage available stock quantities. | Medium (MVP) |

## 3. Tech Stack Selection & Justification

### Frontend Framework: React
Justification: React's component-based architecture is suitable for building reusable interfaces such as Book Cards, navigation, search, book listings, product details, carts, and checkout pages. It provides a structured approach to managing interactive UI while remaining well supported by a large ecosystem.

### Backend Infrastructure: Node.js/Express
Justification: Node.js with Express is selected because it allows the project to use JavaScript across both the React frontend and backend, reducing
the need to manage different programming languages. Express provides a lightweight and well-supported environment for authentication, product management, cart operations, order processing, and REST APIs, while remaining
sufficient for the expected academic workload.

### Database Management System: MySQL
Justification: MySQL is appropriate because the bookstore contains structured relational data and clearly defined relationships among users, products, categories, carts, and orders. Its relational model provides data integrity and supports the PK/FK relationships required by the system. 

### Caching & Asynchronous Processing: Not included in MVP
Justification: Redis or another caching/asynchronous processing layer is not
required for the initial project scope because the expected workload does not justify the additional architectural complexity. It can be considered later if performance optimization or background processing becomes necessary.

### Overall Architecture
The application will follow a client-server architecture:
**React Frontend → REST API → Node.js/Express Backend → MySQL Database**
The React frontend will provide the user interface and communicate with the backend through API requests. The Node.js/Express backend will handle business logic, authentication, product operations, cart management, and order processing, while MySQL will persist the application's relational data.

## 4. Entity-Relationship Diagram (ERD)


### 4.1 Entity Definitions

#### USERS

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | NOT NULL |
| created_at | DATETIME | NOT NULL |

The USERS entity stores customer and administrator accounts. The role attribute distinguishes different types of system users.

#### CATEGORIES

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| description | VARCHAR(255) | NULL |

The CATEGORIES entity organizes books into categories such as Fiction, Mystery, Self-Help, and Academic.

#### PRODUCTS

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| title | VARCHAR(200) | NOT NULL |
| author | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| price | DECIMAL(10,2) | NOT NULL |
| stock_quantity | INT | NOT NULL |
| image_url | VARCHAR(500) | NULL |
| category_id | INT | FK → CATEGORIES.id |

The PRODUCTS entity stores the books available for purchase.

#### ORDERS

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| user_id | INT | FK → USERS.id |
| order_date | DATETIME | NOT NULL |
| total_amount | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| delivery_address | VARCHAR(255) | NOT NULL |

The ORDERS entity stores customer orders and their delivery information.

#### ORDER_ITEMS

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| order_id | INT | FK → ORDERS.id |
| product_id | INT | FK → PRODUCTS.id |
| quantity | INT | NOT NULL |
| unit_price | DECIMAL(10,2) | NOT NULL |

ORDER_ITEMS is the associative entity between ORDERS and PRODUCTS. It stores the quantity and purchase price of each book within an order.

The unit_price is stored separately so that the historical price paid for a book remains available even if the product's current price changes later.

#### CART

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| user_id | INT | FK → USERS.id, UNIQUE |
| created_at | DATETIME | NOT NULL |

The CART entity represents the active shopping cart associated with a customer.

#### CART_ITEMS

| Attribute | Data Type | Key / Constraint |
|---|---|---|
| id | INT | PK |
| cart_id | INT | FK → CART.id |
| product_id | INT | FK → PRODUCTS.id |
| quantity | INT | NOT NULL |

CART_ITEMS is the associative entity between CART and PRODUCTS. It stores which books have been added to a customer's cart and the quantity of each book.

### 4.2 Relationships & Cardinality

| Relationship | Cardinality | Explanation |
|---|---|---|
| USERS → ORDERS | 1:N | One user can place many orders, while each order belongs to one user. |
| USERS → CART | 1:1 | Each user has one active shopping cart, and each cart belongs to one user. |
| CATEGORIES → PRODUCTS | 1:N | One category can contain many books, while each book belongs to one category. |
| ORDERS → ORDER_ITEMS | 1:N | One order can contain multiple order items, while each order item belongs to one order. |
| PRODUCTS → ORDER_ITEMS | 1:N | One book can appear in many order items across different orders. |
| CART → CART_ITEMS | 1:N | One cart can contain multiple cart items, while each cart item belongs to one cart. |
| PRODUCTS → CART_ITEMS | 1:N | One book can appear in many carts, while each cart item refers to one book. |
| ORDERS ↔ PRODUCTS | N:M | An order can contain many products and a product can appear in many orders. This many-to-many relationship is resolved through ORDER_ITEMS. |
| CART ↔ PRODUCTS | N:M | A cart can contain many products and a product can appear in many carts. This many-to-many relationship is resolved through CART_ITEMS. |


### 4.3 Mermaid ERD

```mermaid
erDiagram

    USERS {
        INT id PK
        VARCHAR(100) name
        VARCHAR(150) email UK
        VARCHAR(255) password_hash
        VARCHAR(20) role
        DATETIME created_at
    }

    CATEGORIES {
        INT id PK
        VARCHAR(100) name UK
        VARCHAR(255) description
    }

    PRODUCTS {
        INT id PK
        VARCHAR(200) title
        VARCHAR(150) author
        TEXT description
        DECIMAL(10,2) price
        INT stock_quantity
        VARCHAR(500) image_url
        INT category_id FK
    }

    ORDERS {
        INT id PK
        INT user_id FK
        DATETIME order_date
        DECIMAL(10,2) total_amount
        VARCHAR(30) status
        VARCHAR(255) delivery_address
    }

    ORDER_ITEMS {
        INT id PK
        INT order_id FK
        INT product_id FK
        INT quantity
        DECIMAL(10,2) unit_price
    }

    CART {
        INT id PK
        INT user_id FK
        DATETIME created_at
    }

    CART_ITEMS {
        INT id PK
        INT cart_id FK
        INT product_id FK
        INT quantity
    }

    USERS ||--o{ ORDERS : places
    USERS ||--|| CART : has
    CATEGORIES ||--o{ PRODUCTS : contains
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in
    CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : added_to
```

### 4.4 Data Modeling Summary

The database follows a relational structure in which foreign keys connect related entities and associative entities resolve many-to-many relationships.

The main customer workflow is represented through the following relationships:

**USER → CART → CART_ITEMS → PRODUCT**

and

**USER → ORDER → ORDER_ITEMS → PRODUCT**

This structure provides a clear foundation for implementing the bookstore's catalog, shopping cart, checkout, order processing, and inventory workflows in later development sprints.

