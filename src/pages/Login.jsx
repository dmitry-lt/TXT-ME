import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;
      // ИСПРАВЛЕНО: добавлен userData.role в четвертый параметр
      login(token, userData.userId, userData.username, userData.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
    <h1>Вход</h1>

    {error && <div className="error">{error}</div>}

    <form onSubmit={handleSubmit}>
    <div className="form-group">
    <label>Логин</label>
    <input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    required
    />
    </div>

    <div className="form-group">
    <label>Пароль</label>
    <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    />
    </div>

    <button type="submit" className="btn btn-primary" disabled={loading}>
    {loading ? 'Вход...' : 'Войти'}
    </button>
    </form>

    <p style={{ marginTop: '1rem', textAlign: 'center' }}>
    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
    </p>
    </div>
    </div>
  );
}
