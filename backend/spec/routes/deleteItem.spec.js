const db = require('../../src/persistence');
const deleteItem = require('../../src/routes/deleteItem').default;

jest.mock('../../src/persistence', () => ({
    removeItem: jest.fn(),
    getItem: jest.fn(),
}));

test('it removes item correctly', async () => {
    const req = { params: { id: 12345 }, userId: 'test-user-id' };
    const res = {
        status: jest.fn(() => res),
        sendStatus: jest.fn(),
        json: jest.fn(),
    };

    await deleteItem(req, res);

    expect(db.removeItem.mock.calls.length).toBe(1);
    expect(db.removeItem.mock.calls[0][0]).toBe(req.params.id);
    expect(db.removeItem.mock.calls[0][1]).toBe(req.userId);
    expect(res.sendStatus.mock.calls[0][0]).toBe(200);
});
