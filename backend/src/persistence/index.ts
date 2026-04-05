import 'dotenv/config';
import type { TodoPersistence } from '../types';

const persistence = (process.env.MYSQL_HOST
    ? require('./mysql')
    : require('./sqlite')) as TodoPersistence;

export = persistence;