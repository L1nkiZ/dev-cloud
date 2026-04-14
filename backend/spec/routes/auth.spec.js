const db = require('../../src/persistence');
const { signUp, signIn } = require('../../src/routes/auth');

jest.mock('../../src/persistence', () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
}));

jest.mock('../../src/auth', () => ({
    generateToken: jest.fn(),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
}));

const { generateToken, hashPassword, comparePassword } = require('../../src/auth');

test('signUp creates a new user successfully', async () => {
    const req = {
        body: { email: 'test@example.com', password: 'password123', username: 'testuser' },
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        cookie: jest.fn(),
    };

    db.getUserByEmail.mockResolvedValue(null);
    const mockUser = { id: 'user-id', email: 'test@example.com', username: 'testuser' };
    db.createUser.mockResolvedValue(mockUser);
    hashPassword.mockResolvedValue('hashed-password');
    generateToken.mockReturnValue('jwt-token');

    await signUp(req, res);

    expect(db.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(db.createUser).toHaveBeenCalledWith('test@example.com', 'hashed-password', 'testuser');
    expect(generateToken).toHaveBeenCalledWith({ userId: 'user-id', email: 'test@example.com', username: 'testuser' });
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwt-token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: mockUser,
    });
});

test('signIn logs in user successfully', async () => {
    const req = {
        body: { email: 'test@example.com', password: 'password123' },
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        cookie: jest.fn(),
    };

    const mockUser = { id: 'user-id', email: 'test@example.com', username: 'testuser', hashedPassword: 'hashed-password' };
    db.getUserByEmail.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(true);
    generateToken.mockReturnValue('jwt-token');

    await signIn(req, res);

    expect(db.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(generateToken).toHaveBeenCalledWith({ userId: 'user-id', email: 'test@example.com', username: 'testuser' });
    expect(res.cookie).toHaveBeenCalledWith('token', 'jwt-token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
        user: { id: 'user-id', email: 'test@example.com', username: 'testuser' },
    });
});