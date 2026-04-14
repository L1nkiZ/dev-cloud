import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoListCard } from './TodoListCard';

const API_BASE_URL = process.env.TEST_BACKEND_URL || 'http://127.0.0.1:3000';

let originalFetch: typeof global.fetch | undefined;

jest.setTimeout(20000);

function useRealBackendFetch() {
    originalFetch = global.fetch.bind(global);
    global.fetch = ((input, init) => {
        if (typeof input === 'string' && input.startsWith('/')) {
            return originalFetch!(`${API_BASE_URL}${input}`, init);
        }

        return originalFetch!(input, init);
    }) as typeof global.fetch;
}

function restoreFetch() {
    if (originalFetch) {
        global.fetch = originalFetch;
        originalFetch = undefined;
    }
}

async function assertBackendIsRunning() {
    const response = await fetch(`${API_BASE_URL}/api/greeting`);
    if (!response.ok) {
        throw new Error(
            `Backend is not ready at ${API_BASE_URL}. Start backend before running frontend tests.`,
        );
    }
}

async function resetItems() {
    const response = await fetch('/api/items');
    const items = (await response.json()) as Array<{ id: string }>;

    for (const item of items) {
        await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
    }
}

beforeAll(async () => {
    useRealBackendFetch();
    await assertBackendIsRunning();
});

afterAll(async () => {
    restoreFetch();
});

beforeEach(async () => {
    await resetItems();
});

async function addItemThroughUI(name: string, user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText('New Item'), name);
    await user.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(await screen.findByText(name)).toBeInTheDocument();
}

test('can create an item', async () => {
    const user = userEvent.setup();

    render(<TodoListCard />);

    expect(
        await screen.findByText('No items yet! Add one above!'),
    ).toBeInTheDocument();

    await addItemThroughUI('Buy milk', user);

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

test('can mark an item as complete', async () => {
    const user = userEvent.setup();

    render(<TodoListCard />);

    await screen.findByText('No items yet! Add one above!');
    await addItemThroughUI('Take out trash', user);

    await user.click(
        screen.getByRole('button', { name: 'Mark item as complete' }),
    );

    expect(
        await screen.findByRole('button', { name: 'Mark item as incomplete' }),
    ).toBeInTheDocument();
});

test('can edit an item name', async () => {
    const user = userEvent.setup();

    render(<TodoListCard />);

    await screen.findByText('No items yet! Add one above!');
    await addItemThroughUI('Initial title', user);

    await user.click(screen.getByRole('button', { name: 'Edit item' }));

    const editInput = await screen.findByRole('textbox', {
        name: 'Edit item name',
    });
    await user.clear(editInput);
    await user.type(editInput, 'Updated title');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText('Updated title')).toBeInTheDocument();
    expect(screen.queryByText('Initial title')).not.toBeInTheDocument();
});

test('can uncheck a completed item', async () => {
    const user = userEvent.setup();

    render(<TodoListCard />);

    await screen.findByText('No items yet! Add one above!');
    await addItemThroughUI('Read docs', user);

    await user.click(
        screen.getByRole('button', { name: 'Mark item as complete' }),
    );

    const markIncompleteButton = await screen.findByRole('button', {
        name: 'Mark item as incomplete',
    });
    await user.click(markIncompleteButton);

    expect(
        await screen.findByRole('button', { name: 'Mark item as complete' }),
    ).toBeInTheDocument();
});

test('can delete an item', async () => {
    const user = userEvent.setup();

    render(<TodoListCard />);

    await screen.findByText('No items yet! Add one above!');
    await addItemThroughUI('Old task', user);

    await user.click(screen.getByRole('button', { name: 'Remove Item' }));

    expect(
        await screen.findByText('No items yet! Add one above!'),
    ).toBeInTheDocument();
});
