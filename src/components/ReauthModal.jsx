import { useState } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';

export default function ReauthModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;
      login(token, userData.userId, userData.username, userData.role);

      // Закрываем модальное окно после успешного входа
      onClose();

      // Показываем успешное сообщение
      alert('Вход выполнен! Теперь можете продолжить работу.');
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Сессия истекла</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="modal-description">
          Пожалуйста, войдите снова для продолжения работы. Ваши данные сохранены.
        </p>

        {error && <div className="error modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
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

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
