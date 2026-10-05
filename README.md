# PagesNProse — Online Bookstore

PagesNProse is an e-commerce online bookstore project developed as part of the E-Commerce SDLC course.

The project focuses on building a proper online bookstore where users can browse books and eventually purchase them through an e-commerce system.

## Technology Stack

- Frontend: React
- Backend: Node.js and Express.js
- Database: MySQL
- Testing: Jest and Supertest

## Project Structure

```text
backend/       Backend API and server code
database/      Database schema and seed files
docs/          Sprint documentation
frontend/      Frontend application
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root and configure the required database and authentication variables.

Required variables include:

```text
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Do not commit the `.env` file to GitHub.

### 3. Seed the admin account

```bash
npm run seed:admin
```

### 4. Seed the catalog

```bash
npm run seed:catalog
```

This creates the demonstration categories, products, variants, and SKUs required for Sprint 2.

### 5. Run automated tests

```bash
npm test
```

### 6. Start the backend server

```bash
node backend/server.js
```

The API runs locally on:

http://localhost:3000

## Sprint Documentation

Sprint documentation is available in the `docs` folder.

- Sprint 1: Architecture and scope planning
- Sprint 2: Admin catalog, products, variants, SKUs, database integrity, authentication, authorization, seed data, and automated testing

## Security

Sensitive configuration such as database passwords, admin passwords, and JWT secrets are stored in `.env` and are not committed to the repository.