import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import type { TodoItem, TodoPersistence } from '../types';

type TodoRow = {
    id: string;
    name: string;
    completed: number;
};

const location = process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';

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

            db.run(
                'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)',
                (runErr) => {
                    if (runErr) return rej(runErr);
                    acc();
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

async function getItems() {
    return new Promise<TodoItem[]>((acc, rej) => {
        db.all('SELECT * FROM todo_items', (err, rows: TodoRow[]) => {
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
        db.all(
            'SELECT * FROM todo_items WHERE id=?',
            [id],
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
            'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
            [item.id, item.name, item.completed ? 1 : 0],
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
) {
    return new Promise<void>((acc, rej) => {
        db.run(
            'UPDATE todo_items SET name=?, completed=? WHERE id = ?',
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
        db.run('DELETE FROM todo_items WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

const sqlitePersistence: TodoPersistence = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};

export = sqlitePersistence;
