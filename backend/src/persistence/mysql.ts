import 'dotenv/config';
import fs from 'node:fs';
import waitPort from 'wait-port';
import mysql from 'mysql2';
import type { TodoItem, TodoPersistence } from '../types';

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

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE, 'utf-8').trim() : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE, 'utf-8').trim() : USER;
    const password = PASSWORD_FILE
        ? fs.readFileSync(PASSWORD_FILE, 'utf-8').trim()
        : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE, 'utf-8').trim() : DB;

    await waitPort({
        host,
        port: 3306,
        timeout: 10000,
        waitForDns: true,
    });

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    return new Promise<void>((acc, rej) => {
        pool.query(
            'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean) DEFAULT CHARSET utf8mb4',
            (err) => {
                if (err) return rej(err);

                console.log(`Connected to mysql db at host ${host}`);
                acc();
            },
        );
    });
}

async function teardown() {
    return new Promise<void>((acc, rej) => {
        pool.end((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise<TodoItem[]>((acc, rej) => {
        pool.query('SELECT * FROM todo_items', (err, rows: any[]) => {
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

async function getItem(id: string | number) {
    return new Promise<TodoItem | undefined>((acc, rej) => {
        pool.query('SELECT * FROM todo_items WHERE id=?', [id], (err, rows: any[]) => {
            if (err) return rej(err);
            acc(
                rows.map((item) =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                )[0],
            );
        });
    });
}

async function storeItem(item: TodoItem) {
    return new Promise<void>((acc, rej) => {
        pool.query(
            'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
            [item.id, item.name, item.completed ? 1 : 0],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(id: string | number, item: Pick<TodoItem, 'name' | 'completed'>) {
    return new Promise<void>((acc, rej) => {
        pool.query(
            'UPDATE todo_items SET name=?, completed=? WHERE id=?',
            [item.name, item.completed ? 1 : 0, id],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeItem(id: string | number) {
    return new Promise<void>((acc, rej) => {
        pool.query('DELETE FROM todo_items WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

const mysqlPersistence: TodoPersistence = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};

export = mysqlPersistence;