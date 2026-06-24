import 'dotenv/config';
import fs from 'node:fs';
import waitPort from 'wait-port';
import mysql from 'mysql2';
import { v4 as uuid } from 'uuid';
import type { RowDataPacket } from 'mysql2';
import type { User, PasswordResetToken, AuthPersistence } from '../types.js';

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
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE, 'utf-8').trim() : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE, 'utf-8').trim() : DB;

    console.log(`[Auth-MySQL] Connecting to MySQL at ${host}:3306, database: ${database}`);

    await waitPort({ host, port: 3306, timeout: 30000, waitForDns: true });

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    try {
        await query('DROP TABLE IF EXISTS password_reset_tokens');
    } catch {}

    await query(
        'CREATE TABLE IF NOT EXISTS users (id varchar(36) PRIMARY KEY, email varchar(255) NOT NULL UNIQUE, username varchar(255) NOT NULL UNIQUE, hashedPassword varchar(255) NOT NULL, createdAt bigint NOT NULL) DEFAULT CHARSET utf8mb4'
    );

    await query(
        'CREATE TABLE IF NOT EXISTS password_reset_tokens (id varchar(36) PRIMARY KEY, userId varchar(36) NOT NULL, token varchar(255) NOT NULL UNIQUE, expiresAt bigint NOT NULL, createdAt bigint NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE) DEFAULT CHARSET utf8mb4'
    );

    console.log('[Auth-MySQL] Tables ready');
}

async function teardown() {
    return new Promise<void>((acc, rej) => {
        pool.end((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getUserByEmail(email: string) {
    return new Promise<User | undefined>((acc, rej) => {
        pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
            if (err) return rej(err);
            acc(rows.length > 0 ? (rows[0] as User) : undefined);
        });
    });
}

async function getUserById(id: string) {
    return new Promise<User | undefined>((acc, rej) => {
        pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
            if (err) return rej(err);
            acc(rows.length > 0 ? (rows[0] as User) : undefined);
        });
    });
}

async function createUser(email: string, hashedPassword: string, username: string) {
    const userId = uuid();
    return new Promise<User>((acc, rej) => {
        pool.query(
            'INSERT INTO users (id, email, username, hashedPassword, createdAt) VALUES (?, ?, ?, ?, ?)',
            [userId, email, username, hashedPassword, Date.now()],
            (err) => {
                if (err) return rej(err);
                acc({ id: userId, email, username, hashedPassword, createdAt: Date.now() });
            },
        );
    });
}

async function updatePassword(userId: string, hashedPassword: string) {
    return new Promise<void>((acc, rej) => {
        pool.query('UPDATE users SET hashedPassword = ? WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) return rej(err);
            acc();
        });
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
                acc({ id: tokenId, userId, token, expiresAt, createdAt: Date.now() });
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

const mysqlPersistence: AuthPersistence = {
    init,
    teardown,
    getUserByEmail,
    getUserById,
    createUser,
    updatePassword,
    createPasswordResetToken,
    getPasswordResetToken,
    deletePasswordResetToken,
};

export default mysqlPersistence;
