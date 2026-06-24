import 'dotenv/config';
import type { AuthPersistence } from '../types.js';

const persistenceModule = await (
    process.env.MYSQL_HOST ? import('./mysql.js') : import('./sqlite.js')
);

const persistence = persistenceModule.default as AuthPersistence;

export default persistence;
