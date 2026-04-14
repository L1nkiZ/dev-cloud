import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { v4 as uuid } from 'uuid';
import type { TodoItem, TodoPersistence, User, PasswordResetToken, AuthPersistence } from '../types.js';

type TodoRow = {
    id: string;
    name: string;
    completed: number;
    userId: string;
};

type UserRow = {
    id: string;
    email: string;
    username: string;
    hashedPassword: string;
    createdAt: number;
};

type ResetTokenRow = {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
    createdAt: number;
};

const location =
    process.env.SQLITE_DB_LOCATION ||
    (process.env.NODE_ENV === 'test'
        ? path.join(process.cwd(), 'tmp', 'todo.db')
        : path.join(process.cwd(), 'data', 'todo.db'));

let db: sqlite3.Database;

function init() {
    const dirName = path.dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    return new Promise<void>((acc, rej) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) return rej(err);

            if (process.env.NODE_ENV !== 'test') {
                console.log(`Using sqlite database at ${location}`);
            }

            // Create todo_items table
            db.run(
                'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36) PRIMARY KEY, name varchar(255), completed boolean, userId varchar(36), FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE)',
                (runErr) => {
                    if (runErr) return rej(runErr);

                    // Create users table
                    db.run(
                        'CREATE TABLE IF NOT EXISTS users (id varchar(36) PRIMARY KEY, email varchar(255) NOT NULL UNIQUE, username varchar(255) NOT NULL UNIQUE, hashedPassword varchar(255) NOT NULL, createdAt integer NOT NULL)',
                        (userErr) => {
                            if (userErr) return rej(userErr);

                            // Create password_reset_tokens table
                            db.run(
                                'CREATE TABLE IF NOT EXISTS password_reset_tokens (id varchar(36) PRIMARY KEY, userId varchar(36) NOT NULL, token varchar(255) NOT NULL UNIQUE, expiresAt integer NOT NULL, createdAt integer NOT NULL, FOREIGN KEY (userId) REFERENCES users(id))',
                                (tokenErr) => {
                                    if (tokenErr) return rej(tokenErr);
                                    acc();
                                },
                            );
                        },
                    );
                },
            );
        });
    });
}

async function teardown() {
    if (!db) {
        return;
    }

    return new Promise<void>((acc, rej) => {
        db.close((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

// TODO persistence methods
async function getItems(userId: string) {
    return new Promise<TodoItem[]>((acc, rej) => {
        db.all('SELECT * FROM todo_items WHERE userId=?', [userId], (err, rows: TodoRow[]) => {
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
        db.all(
            'SELECT * FROM todo_items WHERE id=? AND userId=?',
            [id, userId],
            (err, rows: TodoRow[]) => {
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
        db.run(
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
        db.run(
            'UPDATE todo_items SET name=?, completed=? WHERE id = ? AND userId = ?',
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
        db.run('DELETE FROM todo_items WHERE id = ? AND userId = ?', [id, userId], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

// Auth persistence methods
async function getUserByEmail(email: string) {
    return new Promise<User | undefined>((acc, rej) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row: UserRow) => {
            if (err) return rej(err);
            acc(row ? (row as User) : undefined);
        });
    });
}

async function getUserById(id: string) {
    return new Promise<User | undefined>((acc, rej) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: UserRow) => {
            if (err) return rej(err);
            acc(row ? (row as User) : undefined);
        });
    });
}

async function createUser(email: string, hashedPassword: string, username: string) {
    const userId = uuid();
    return new Promise<User>((acc, rej) => {
        db.run(
            'INSERT INTO users (id, email, username, hashedPassword, createdAt) VALUES (?, ?, ?, ?, ?)',
            [userId, email, username, hashedPassword, Date.now()],
            function (err) {
                if (err) return rej(err);
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
        db.run(
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
        db.run(
            'INSERT INTO password_reset_tokens (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
            [tokenId, userId, token, expiresAt, Date.now()],
            function (err) {
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
        db.get(
            'SELECT * FROM password_reset_tokens WHERE token = ?',
            [token],
            (err, row: ResetTokenRow) => {
                if (err) return rej(err);
                acc(row ? (row as PasswordResetToken) : undefined);
            },
        );
    });
}

async function deletePasswordResetToken(id: string) {
    return new Promise<void>((acc, rej) => {
        db.run('DELETE FROM password_reset_tokens WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

const sqlitePersistence: TodoPersistence & AuthPersistence = {
    // Todo methods
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

export default sqlitePersistence;

