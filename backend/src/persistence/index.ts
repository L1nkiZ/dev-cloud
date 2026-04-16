import 'dotenv/config';
import type { TodoPersistence, AuthPersistence } from '../types.js';

type Database = TodoPersistence & AuthPersistence;

const persistenceModule = await (
    process.env.MYSQL_HOST ? import('./mysql.js') : import('./sqlite.js')
);

const persistence = persistenceModule.default as Database;

export default persistence;
