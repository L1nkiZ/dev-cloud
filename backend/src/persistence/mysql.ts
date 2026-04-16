import 'dotenv/config';
import fs from 'node:fs';
import waitPort from 'wait-port';
import mysql from 'mysql2';
import { v4 as uuid } from 'uuid';
import type { RowDataPacket } from 'mysql2';
import type { TodoItem, TodoPersistence, User, PasswordResetToken, AuthPersistence } from '../types.js';

type TodoRow = RowDataPacket & {
    id: string;
    name: string;
    completed: number;
    userId: string;
};

type UserRow = RowDataPacket & {
    id: string;
    email: string;
    username: string;
    hashedPassword: string;
    createdAt: number;
};

type ResetTokenRow = RowDataPacket & {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
    createdAt: number;
};

const {
    MYSQL_HOST: HOST,
    MYSQL_HOST_FILE: HOST_FILE,
    MYSQL_USER: USER,
    MYSQL_USER_FILE: USER_FILE,
    MYSQL_PASSWORD: PASSWORD,
    MYSQL_PASSWORD_FILE: PASSWORD_FILE,
    MYSQL_DB: DB,
    MYSQL_DB_FILE: DB_FILE,
} = process.env;

let pool: mysql.Pool;

function query(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE, 'utf-8').trim() : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE, 'utf-8').trim() : USER;
    const password = PASSWORD_FILE
        ? fs.readFileSync(PASSWORD_FILE, 'utf-8').trim()
        : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE, 'utf-8').trim() : DB;

    console.log(`[MySQL] Connecting to MySQL at ${host}:3306, database: ${database}, user: ${user}`);

    await waitPort({
        host,
        port: 3306,
        timeout: 30000,
        waitForDns: true,
    });

    console.log(`[MySQL] Port 3306 is now accessible on ${host}`);

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    // Drop and recreate todo_items table with userId
    try {
        await query('DROP TABLE IF EXISTS todo_items');
    } catch (dropErr: unknown) {
        const err = dropErr as Record<string, unknown>;
        console.error('[MySQL] Warning: Could not drop todo_items (may not exist):', err.message);
    }

    // Drop password_reset_tokens if exists
    try {
        await query('DROP TABLE IF EXISTS password_reset_tokens');
    } catch (dropErr: unknown) {
        const err = dropErr as Record<string, unknown>;
        console.error('[MySQL] Warning: Could not drop password_reset_tokens (may not exist):', err.message);
    }

    // Create users table
    await query(
        'CREATE TABLE IF NOT EXISTS users (id varchar(36) PRIMARY KEY, email varchar(255) NOT NULL UNIQUE, username varchar(255) NOT NULL UNIQUE, hashedPassword varchar(255) NOT NULL, createdAt bigint NOT NULL) DEFAULT CHARSET utf8mb4'
    );
    console.log(`[MySQL] users table ready`);

    // Try to add username column if it doesn't exist (for existing tables)
    try {
        await query('ALTER TABLE users ADD COLUMN username varchar(255) NOT NULL UNIQUE');
    } catch (alterErr: unknown) {
        const err = alterErr as Record<string, unknown>;
        if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error('[MySQL] Error adding username column:', err);
            throw alterErr;
        }
    }

    console.log('[MySQL] users table schema checked');

    // Create todo_items table with userId
    await query(
        'CREATE TABLE todo_items (id varchar(36) PRIMARY KEY, name varchar(255), completed boolean, userId varchar(36), FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE) DEFAULT CHARSET utf8mb4'
    );
    console.log(`[MySQL] todo_items table ready`);

    // Create password_reset_tokens table
    await query(
        'CREATE TABLE IF NOT EXISTS password_reset_tokens (id varchar(36) PRIMARY KEY, userId varchar(36) NOT NULL, token varchar(255) NOT NULL UNIQUE, expiresAt bigint NOT NULL, createdAt bigint NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE) DEFAULT CHARSET utf8mb4'
    );
    console.log(`[MySQL] password_reset_tokens table ready`);

    console.log(`[MySQL] Connected to mysql db at host ${host}`);
}

async function teardown() {
    return new Promise<void>((acc, rej) => {
        pool.end((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

// TODO persistence methods
async function getItems(userId: string) {
    return new Promise<TodoItem[]>((acc, rej) => {
        pool.query<TodoRow[]>('SELECT * FROM todo_items WHERE userId=?', [userId], (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.map((item) =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                ),
            );
        });
    });
}

async function getItem(id: string | number, userId: string) {
    return new Promise<TodoItem | undefined>((acc, rej) => {
        pool.query<TodoRow[]>(
            'SELECT * FROM todo_items WHERE id=? AND userId=?',
            [id, userId],
            (err, rows) => {
                if (err) return rej(err);
                acc(
                    rows.map((item) =>
                        Object.assign({}, item, {
                            completed: item.completed === 1,
                        }),
                    )[0],
                );
            },
        );
    });
}

async function storeItem(item: TodoItem) {
    return new Promise<void>((acc, rej) => {
        pool.query(
            'INSERT INTO todo_items (id, name, completed, userId) VALUES (?, ?, ?, ?)',
            [item.id, item.name, item.completed ? 1 : 0, item.userId],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(
    id: string | number,
    item: Pick<TodoItem, 'name' | 'completed'>,
    userId: string,
) {
    return new Promise<void>((acc, rej) => {
        pool.query(
            'UPDATE todo_items SET name=?, completed=? WHERE id=? AND userId=?',
            [item.name, item.completed ? 1 : 0, id, userId],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id: string | number, userId: string) {
    return new Promise<void>((acc, rej) => {
        pool.query('DELETE FROM todo_items WHERE id=? AND userId=?', [id, userId], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

// Auth persistence methods
async function getUserByEmail(email: string) {
    return new Promise<User | undefined>((acc, rej) => {
        console.log(`[MySQL] Getting user by email: ${email}`);
        pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
            if (err) {
                console.error(`[MySQL] Error getting user by email:`, err);
                return rej(err);
            }
            console.log(`[MySQL] Got ${rows.length} user(s) for email ${email}`);
            acc(rows.length > 0 ? (rows[0] as User) : undefined);
        });
    });
}

async function getUserById(id: string) {
    return new Promise<User | undefined>((acc, rej) => {
        console.log(`[MySQL] Getting user by id: ${id}`);
        pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
            if (err) {
                console.error(`[MySQL] Error getting user by id:`, err);
                return rej(err);
            }
            console.log(`[MySQL] Got user: ${rows.length > 0 ? rows[0].email : 'not found'}`);
            acc(rows.length > 0 ? (rows[0] as User) : undefined);
        });
    });
}

async function createUser(email: string, hashedPassword: string, username: string) {
    const userId = uuid();
    return new Promise<User>((acc, rej) => {
        console.log(`[MySQL] Creating user with email: ${email} and username: ${username}`);
        pool.query(
            'INSERT INTO users (id, email, username, hashedPassword, createdAt) VALUES (?, ?, ?, ?, ?)',
            [userId, email, username, hashedPassword, Date.now()],
            (err) => {
                if (err) {
                    console.error(`[MySQL] Error creating user:`, err);
                    return rej(err);
                }
                console.log(`[MySQL] User created successfully with id: ${userId}`);
                acc({
                    id: userId,
                    email,
                    username,
                    hashedPassword,
                    createdAt: Date.now(),
                });
            },
        );
    });
}

async function updatePassword(userId: string, hashedPassword: string) {
    return new Promise<void>((acc, rej) => {
        pool.query(
            'UPDATE users SET hashedPassword = ? WHERE id = ?',
            [hashedPassword, userId],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function createPasswordResetToken(userId: string, token: string, expiresAt: number) {
    const tokenId = uuid();
    return new Promise<PasswordResetToken>((acc, rej) => {
        pool.query(
            'INSERT INTO password_reset_tokens (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
            [tokenId, userId, token, expiresAt, Date.now()],
            (err) => {
                if (err) return rej(err);
                acc({
                    id: tokenId,
                    userId,
                    token,
                    expiresAt,
                    createdAt: Date.now(),
                });
            },
        );
    });
}

async function getPasswordResetToken(token: string) {
    return new Promise<PasswordResetToken | undefined>((acc, rej) => {
        pool.query<ResetTokenRow[]>(
            'SELECT * FROM password_reset_tokens WHERE token = ?',
            [token],
            (err, rows) => {
                if (err) return rej(err);
                acc(rows.length > 0 ? (rows[0] as PasswordResetToken) : undefined);
            },
        );
    });
}

async function deletePasswordResetToken(id: string) {
    return new Promise<void>((acc, rej) => {
        pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

const mysqlPersistence: TodoPersistence & AuthPersistence = {
    // TODO methods
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
    // Auth methods
    getUserByEmail,
    getUserById,
    createUser,
    updatePassword,
    createPasswordResetToken,
    getPasswordResetToken,
    deletePasswordResetToken,
};

export default mysqlPersistence;

