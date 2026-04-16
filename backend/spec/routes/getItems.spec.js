const db = require('../../src/persistence');
const getItems = require('../../src/routes/getItems').default;
const ITEMS = [{ id: 12345 }];

jest.mock('../../src/persistence', () => ({
    getItems: jest.fn(),
}));

test('it gets items correctly', async () => {
    const req = { userId: 'test-user-id' };
    const res = {
        status: jest.fn(() => res),
        send: jest.fn(),
        json: jest.fn(),
    };
    db.getItems.mockReturnValue(Promise.resolve(ITEMS));

    await getItems(req, res);

    expect(db.getItems.mock.calls.length).toBe(1);
    expect(db.getItems.mock.calls[0][0]).toBe(req.userId);
    expect(res.send.mock.calls[0][0]).toEqual(ITEMS);
});
