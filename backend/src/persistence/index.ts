import 'dotenv/config';
import type { TodoPersistence } from '../types';
import mysqlPersistence from './mysql';
import sqlitePersistence from './sqlite';

const persistence = (
    process.env.MYSQL_HOST ? mysqlPersistence : sqlitePersistence
) as TodoPersistence;

export = persistence;
