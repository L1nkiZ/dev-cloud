import 'dotenv/config';
import express from 'express';
import type { TodoPersistence } from './types';

const app = express();
const db = require('./persistence') as TodoPersistence;
const getGreeting = require('./routes/getGreeting');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');

const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(__dirname + '/static'));

app.get('/api/greeting', getGreeting);
app.get('/api/items', getItems);
app.post('/api/items', addItem);
app.put('/api/items/:id', updateItem);
app.delete('/api/items/:id', deleteItem);

db.init()
    .then(() => {
        app.listen(port, () => console.log(`Listening on port ${port}`));
    })
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon