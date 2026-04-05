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

test('can add an item, mark it complete, and delete it', async () => {
    const user = userEvent.setup();

    render(<TodoListCard />);

    expect(
        await screen.findByText('No items yet! Add one above!'),
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('New Item'), 'Buy milk');
    await user.click(screen.getByRole('button', { name: 'Add Item' }));

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();

    await user.click(
        screen.getByRole('button', { name: 'Mark item as complete' }),
    );

    expect(
        await screen.findByRole('button', { name: 'Mark item as incomplete' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Item' }));

    expect(
        await screen.findByText('No items yet! Add one above!'),
    ).toBeInTheDocument();
});
