const db = require('../../src/persistence');
const updateItem = require('../../src/routes/updateItem').default;
const ITEM = { id: 12345, userId: 'test-user-id' };

jest.mock('../../src/persistence', () => ({
    getItem: jest.fn(),
    updateItem: jest.fn(),
}));

test('it updates items correctly', async () => {
    const req = {
        params: { id: 1234 },
        body: { name: 'New title', completed: false },
        userId: 'test-user-id',
    };
    const res = {
        status: jest.fn(() => res),
        send: jest.fn(),
        json: jest.fn(),
    };

    db.getItem.mockReturnValue(Promise.resolve(ITEM));

    await updateItem(req, res);

    expect(db.updateItem.mock.calls.length).toBe(1);
    expect(db.updateItem.mock.calls[0][0]).toBe(req.params.id);
    expect(db.updateItem.mock.calls[0][1]).toEqual({
        name: 'New title',
        completed: false,
    });
    expect(db.updateItem.mock.calls[0][2]).toBe(req.userId);

    expect(db.getItem.mock.calls.length).toBe(1);
    expect(db.getItem.mock.calls[0][0]).toBe(req.params.id);
    expect(db.getItem.mock.calls[0][1]).toBe(req.userId);

    expect(res.send.mock.calls[0][0]).toEqual(ITEM);
});

test('it updates the todo text via update route', async () => {
    const req = {
        params: { id: 9876 },
        body: { name: 'Edited task label', completed: true },
        userId: 'test-user-id',
    };
    const res = {
        status: jest.fn(() => res),
        send: jest.fn(),
        json: jest.fn(),
    };
    const updatedItem = { id: 9876, name: 'Edited task label', completed: true, userId: 'test-user-id' };

    db.getItem.mockReturnValue(Promise.resolve(updatedItem));

    await updateItem(req, res);

    expect(db.updateItem).toHaveBeenCalledWith(req.params.id, {
        name: 'Edited task label',
        completed: true,
    }, req.userId);
    expect(db.getItem).toHaveBeenCalledWith(req.params.id, req.userId);
    expect(res.send).toHaveBeenCalledWith(updatedItem);
});
