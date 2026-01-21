import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            console.log('Login result:', result);

            // Result is already AuthResponse (user, accessToken, etc)
            if (result && result.user && result.user.id) {
                // Save user to auth context
                setUser(result.user);

                // Redirect based on roles
                const hasAdmin = result.user.roles?.includes('ADMIN');
                const hasPM = result.user.roles?.includes('PRODUCT_MANAGER');

                // Differentiate redirect based on role
                if (hasAdmin) {
                    navigate('/management/admin/users');
                } else if (hasPM) {
                    navigate('/management/pm/products');
                } else {
                    // Regular user - go to home
                    navigate('/home');
                }
            } else {
                setError('Login failed. Invalid response from server.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Login to CXWUD</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
