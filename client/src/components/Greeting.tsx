import { useEffect, useState } from 'react';

const API_URL = '/api';

export function Greeting() {
    const [greeting, setGreeting] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/greeting`, {
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => setGreeting(data.greeting));
    }, []);

    if (!greeting) return null;

    return <h1 className="text-center mb-5">{greeting}</h1>;
}
