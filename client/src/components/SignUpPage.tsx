import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../services/authService';
import { useAuth } from '../services/authContext';
import './AuthPages.scss';

export default function SignUpPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState({ email: '', username: '', password: '', passwordConfirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.username.trim()) {
            setError('Le nom d’utilisateur est requis');
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.passwordConfirm) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);

        try {
            await signUp({
                email: formData.email,
                username: formData.username,
                password: formData.password,
            });
            await refreshUser();
            navigate('/notes');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Créer un compte</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Nom d’utilisateur</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="passwordConfirm">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            id="passwordConfirm"
                            name="passwordConfirm"
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Création....' : 'S\'inscrire'}
                    </button>
                </form>
                <div className="auth-links">
                    <p>
                        Déjà inscrit ? <Link to="/login">Se connecter</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
