import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoListCard } from './TodoListCard';

const API_BASE_URL = process.env.TEST_BACKEND_URL || 'http://127.0.0.1:3000';

let originalFetch: typeof global.fetch | undefined;
let cookieJar = '';

jest.setTimeout(20000);

function updateCookieJar(setCookieHeader: string) {
    const cookieValue = setCookieHeader.split(';')[0];
    const [name] = cookieValue.split('=');
    const cookies = cookieJar
        .split('; ')
        .filter((cookie) => cookie && !cookie.startsWith(`${name}=`));
    cookies.push(cookieValue);
    cookieJar = cookies.join('; ');
}

function useRealBackendFetch() {
    originalFetch = global.fetch.bind(global);
    global.fetch = (async (input, init) => {
        if (typeof input === 'string' && input.startsWith('/')) {
            const headers = new Headers(init?.headers ?? undefined);
            if (cookieJar) {
                headers.set('cookie', cookieJar);
            }

            const response = await originalFetch!(`${API_BASE_URL}${input}`, {
                ...init,
                headers,
            });

            const rawHeaders = (response.headers as { raw?: () => Record<string, string[]> }).raw?.();
            const setCookie =
                rawHeaders?.['set-cookie']?.[0] || response.headers.get('set-cookie');
            if (setCookie) {
                updateCookieJar(setCookie);
            }

            return response;
        }

        return originalFetch!(input, init);
    }) as typeof global.fetch;
}

function restoreFetch() {
    if (originalFetch) {
        global.fetch = originalFetch;
        originalFetch = undefined;
        cookieJar = '';
    }
}

async function assertBackendIsRunning() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
        throw new Error(
            `Backend is not ready at ${API_BASE_URL}. Start backend before running frontend tests.`,
        );
    }
}

async function ensureTestUserIsAuthenticated() {
    const credentials = {
        email: 'user@example.com',
        password: 'password',
        username: 'default user',
    };

    let response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
    });

    if (response.status === 409) {
        response = await fetch('/api/auth/sign-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
            }),
            credentials: 'include',
        });
    }

    if (!response.ok) {
        throw new Error('Could not sign in test user for frontend tests');
    }
}

async function resetItems() {
    const response = await fetch('/api/items', {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Could not reset items because the frontend test user is not authenticated');
    }

    const items = (await response.json()) as Array<{ id: string }>;

    for (const item of items) {
        await fetch(`/api/items/${item.id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    }
}

beforeAll(async () => {
    useRealBackendFetch();
    await assertBackendIsRunning();
    await ensureTestUserIsAuthenticated();
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
