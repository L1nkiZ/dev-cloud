export interface SignUpCredentials {
    email: string;
    password: string;
    username: string;
}

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
}

export interface AuthResponse {
    message: string;
    user: User;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to safely parse JSON responses
async function parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', { status: response.status, text });
        throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`);
    }
    
    return response.json() as Promise<T>;
}

// Sign up
export async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/sign-up`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        try {
            const error = await parseResponse<{ error: string }>(response);
            throw new Error(error.error || 'Sign up failed');
        } catch (err) {
            if (err instanceof Error && err.message.includes('Server error')) {
                throw err;
            }
            throw new Error(`Sign up failed (${response.status})`);
        }
    }

    return parseResponse<AuthResponse>(response);
}

// Sign in
export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/sign-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        try {
            const error = await parseResponse<{ error: string }>(response);
            throw new Error(error.error || 'Sign in failed');
        } catch (err) {
            if (err instanceof Error && err.message.includes('Server error')) {
                throw err;
            }
            throw new Error(`Sign in failed (${response.status})`);
        }
    }

    return parseResponse<AuthResponse>(response);
}

// Forgot password
export async function forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        try {
            const error = await parseResponse<{ error: string }>(response);
            throw new Error(error.error || 'Forgot password request failed');
        } catch (err) {
            if (err instanceof Error && err.message.includes('Server error')) {
                throw err;
            }
            throw new Error(`Forgot password request failed (${response.status})`);
        }
    }

    return parseResponse<{ message: string }>(response);
}

// Reset password
export async function resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        try {
            const error = await parseResponse<{ error: string }>(response);
            throw new Error(error.error || 'Password reset failed');
        } catch (err) {
            if (err instanceof Error && err.message.includes('Server error')) {
                throw err;
            }
            throw new Error(`Password reset failed (${response.status})`);
        }
    }

    return parseResponse<{ message: string }>(response);
}

// Logout
export async function logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        try {
            const error = await parseResponse<{ error: string }>(response);
            throw new Error(error.error || 'Logout failed');
        } catch (err) {
            if (err instanceof Error && err.message.includes('Server error')) {
                throw err;
            }
            throw new Error(`Logout failed (${response.status})`);
        }
    }

    return parseResponse<{ message: string }>(response);
}

// Get current user
export async function getCurrentUser(): Promise<{ user: User }> {
    const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        try {
            const error = await parseResponse<{ error: string }>(response);
            throw new Error(error.error || 'Failed to get current user');
        } catch (err) {
            if (err instanceof Error && err.message.includes('Server error')) {
                throw err;
            }
            throw new Error(`Failed to get current user (${response.status})`);
        }
    }

    return parseResponse<{ user: User }>(response);
}
