export type TodoItem = {
    id: string;
    name: string;
    completed: boolean;
};

export type TodoPersistence = {
    init: () => Promise<void>;
    teardown: () => Promise<void>;
    getItems: () => Promise<TodoItem[]>;
    getItem: (id: string | number) => Promise<TodoItem | undefined>;
    storeItem: (item: TodoItem) => Promise<void>;
    updateItem: (
        id: string | number,
        item: Pick<TodoItem, 'name' | 'completed'>,
    ) => Promise<void>;
    removeItem: (id: string | number) => Promise<void>;
};
