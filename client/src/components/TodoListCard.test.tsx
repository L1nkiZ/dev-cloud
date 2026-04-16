import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoListCard } from './TodoListCard';
import { createItemsApiMock } from '../../test/apiMock';

const apiMock = createItemsApiMock();

beforeAll(() => {
    apiMock.install();
});

afterAll(() => {
    apiMock.restore();
});

beforeEach(() => {
    apiMock.resetState();
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
