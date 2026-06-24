export type User = {
    id: string;
    email: string;
    username: string;
    hashedPassword: string;
    createdAt: number;
};

export type PasswordResetToken = {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
    createdAt: number;
};

export type AuthPersistence = {
    init: () => Promise<void>;
    teardown: () => Promise<void>;
    getUserByEmail: (email: string) => Promise<User | undefined>;
    getUserById: (id: string) => Promise<User | undefined>;
    createUser: (email: string, hashedPassword: string, username: string) => Promise<User>;
    updatePassword: (userId: string, hashedPassword: string) => Promise<void>;
    createPasswordResetToken: (userId: string, token: string, expiresAt: number) => Promise<PasswordResetToken>;
    getPasswordResetToken: (token: string) => Promise<PasswordResetToken | undefined>;
    deletePasswordResetToken: (id: string) => Promise<void>;
};
