export type TodoItem = {
    id: string;
    name: string;
    completed: boolean;
    userId: string;
};

export type User = {
    id: string;
    email: string;
    username: string;
    hashedPassword: string;
    createdAt: number;
};

export type UserPublic = Omit<User, 'hashedPassword'>;

export type PasswordResetToken = {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
    createdAt: number;
};

export type TodoPersistence = {
    init: () => Promise<void>;
    teardown: () => Promise<void>;
    getItems: (userId: string) => Promise<TodoItem[]>;
    getItem: (id: string | number, userId: string) => Promise<TodoItem | undefined>;
    storeItem: (item: TodoItem) => Promise<void>;
    updateItem: (
        id: string | number,
        item: Pick<TodoItem, 'name' | 'completed'>,
        userId: string,
    ) => Promise<void>;
    removeItem: (id: string | number, userId: string) => Promise<void>;
};

export type AuthPersistence = {
    getUserByEmail: (email: string) => Promise<User | undefined>;
    getUserById: (id: string) => Promise<User | undefined>;
    createUser: (email: string, hashedPassword: string, username: string) => Promise<User>;
    updatePassword: (userId: string, hashedPassword: string) => Promise<void>;
    createPasswordResetToken: (userId: string, token: string, expiresAt: number) => Promise<PasswordResetToken>;
    getPasswordResetToken: (token: string) => Promise<PasswordResetToken | undefined>;
    deletePasswordResetToken: (id: string) => Promise<void>;
};
