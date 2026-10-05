const bcrypt = require("bcryptjs");
const db = require("../../backend/config/db");
require("dotenv").config();

async function seedAdmin() {
    try {
        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            console.log("Admin account already exists.");
            return;
        }

        await db.query(
            `INSERT INTO users
            (name, email, password_hash, role)
            VALUES (?, ?, ?, 'admin')`,
            [name, email, passwordHash]
        );

        console.log("Admin account created successfully.");
        console.log(`Email: ${email}`);

    } catch (error) {
        console.error("Admin seed failed:", error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

seedAdmin();