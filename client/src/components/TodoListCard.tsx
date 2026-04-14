import { useCallback, useEffect, useState } from 'react';
import { AddItemForm } from './AddNewItemForm';
import { ItemDisplay } from './ItemDisplay';

interface TodoItem {
    id: string;
    name: string;
    completed: boolean;
}

const API_URL = process.env.VITE_API_URL || '/api';

export function TodoListCard() {
    const [items, setItems] = useState<TodoItem[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${API_URL}/items`, {
            credentials: 'include',
        })
            .then((r) => {
                if (!r.ok) {
                    throw new Error(`API error: ${r.status}`);
                }

                return r.json();
            })
            .then(setItems)
            .catch(() => {
                setError(
                    'Backend indisponible. Verifie que le serveur tourne.',
                );
                setItems([]);
            });
    }, []);

    const onNewItem = useCallback(
        (newItem: TodoItem) => {
            setItems([...(items || []), newItem]);
        },
        [items],
    );

    const onItemUpdate = useCallback(
        (item: TodoItem) => {
            const index = items?.findIndex((i) => i.id === item.id) ?? -1;
            if (index === -1 || !items) return;
            setItems([
                ...items.slice(0, index),
                item,
                ...items.slice(index + 1),
            ]);
        },
        [items],
    );

    const onItemRemoval = useCallback(
        (item: TodoItem) => {
            const index = items?.findIndex((i) => i.id === item.id) ?? -1;
            if (index === -1 || !items) return;
            setItems([...items.slice(0, index), ...items.slice(index + 1)]);
        },
        [items],
    );

    if (items === null) return <div>Loading...</div>;

    return (
        <>
            {error && <p className="text-center text-danger">{error}</p>}
            <AddItemForm onNewItem={onNewItem} />
            {items.length === 0 && (
                <p className="text-center">No items yet! Add one above!</p>
            )}
            {items.map((item) => (
                <ItemDisplay
                    key={item.id}
                    item={item}
                    onItemUpdate={onItemUpdate}
                    onItemRemoval={onItemRemoval}
                />
            ))}
        </>
    );
}
