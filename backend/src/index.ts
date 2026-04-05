import 'dotenv/config';
import express from 'express';
import db from './persistence';
import getGreeting from './routes/getGreeting';
import getItems from './routes/getItems';
import addItem from './routes/addItem';
import updateItem from './routes/updateItem';
import deleteItem from './routes/deleteItem';

const app = express();

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
