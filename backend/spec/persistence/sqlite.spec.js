const fs = require('fs');
const path = require('path');
const location =
    process.env.SQLITE_DB_LOCATION ||
    path.resolve(__dirname, '../../.tmp-tests/todo-test.db');

process.env.SQLITE_DB_LOCATION = location;

const db = require('../../src/persistence/sqlite').default;

const USER_ID = 'test-user-id';

const ITEM = {
    id: '7aef3d7c-d301-4846-8358-2a91ec9d6be3',
    name: 'Test',
    completed: false,
    userId: USER_ID,
};

beforeEach(async () => {
    fs.mkdirSync(path.dirname(location), { recursive: true });

    if (fs.existsSync(location)) {
        fs.unlinkSync(location);
    }
});

afterEach(async () => {
    try {
        await db.teardown();
    } catch {
        // Ignore errors during teardown
    }
});

test('it initializes correctly', async () => {
    await db.init();
});

test('it can store and retrieve items', async () => {
    await db.init();

    await db.storeItem(ITEM);

    const items = await db.getItems(USER_ID);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(ITEM);
});

test('it can update an existing item', async () => {
    await db.init();

    const initialItems = await db.getItems(USER_ID);
    expect(initialItems.length).toBe(0);

    await db.storeItem(ITEM);

    await db.updateItem(
        ITEM.id,
        Object.assign({}, ITEM, { completed: !ITEM.completed }),
        USER_ID
    );

    const items = await db.getItems(USER_ID);
    expect(items.length).toBe(1);
    expect(items[0].completed).toBe(!ITEM.completed);
    expect(items[0]).toEqual({ ...ITEM, completed: !ITEM.completed });
});

test('it can remove an existing item', async () => {
    await db.init();
    await db.storeItem(ITEM);

    await db.removeItem(ITEM.id, USER_ID);

    const items = await db.getItems(USER_ID);
    expect(items.length).toBe(0);
});

test('it can get a single item', async () => {
    await db.init();
    await db.storeItem(ITEM);

    const item = await db.getItem(ITEM.id, USER_ID);
    expect(item).toEqual(ITEM);
});
