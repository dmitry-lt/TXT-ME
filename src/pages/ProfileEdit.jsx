import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';

function ProfileEdit() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatars, setAvatars] = useState([]);
  const [activeAvatarId, setActiveAvatarId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await profileAPI.getProfile();
      const data = response.data;
      setProfile(data);
      setEmail(data.email || '');
      setAvatars(data.avatars || []);
      setActiveAvatarId(data.activeAvatarId || null);
    } catch (err) {
      if (err.response && err.response.status === 401) {

      } else {
        setError('Ошибка загрузки профиля');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email управление
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await profileAPI.updateEmail(email);
      setSuccess('Email обновлён');
      setShowEmailForm(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления email');
    }
  };

  const handleDeleteEmail = async () => {
    if (!confirm('Удалить email?')) return;

    try {
      await profileAPI.deleteEmail();
      setSuccess('Email удалён');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления email');
    }
  };

  // Пароль
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }

    try {
      await profileAPI.updatePassword(oldPassword, newPassword);
      setSuccess('Password updated successfully');
      setShowPasswordForm(false);  // ← Закрыть форму
      localStorage.removeItem('token');  // Logout
      navigate('/login');  // Redirect login
      return;  // Не refetch
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }

  };

  // Аватары - resize to 50x50
  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 50;
          canvas.height = 50;
          const ctx = canvas.getContext('2d');

          // Масштабирование с сохранением пропорций
          const scale = Math.max(50 / img.width, 50 / img.height);
          const x = (50 / 2) - (img.width / 2) * scale;
          const y = (50 / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const dataUrl = await resizeImage(file);
      await profileAPI.addAvatar(dataUrl);
      setSuccess('Аватар загружен');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки аватара');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    if (!confirm('Удалить аватар?')) return;

    try {
      await profileAPI.deleteAvatar(avatarId);
      setSuccess('Аватар удалён');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const handleSetActive = async (avatarId) => {
    try {
      await profileAPI.setActiveAvatar(avatarId);
      setSuccess('Активный аватар установлен');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка установки аватара');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="profile-edit">
    <h1>Редактирование профиля</h1>

    {error && <div className="error">{error}</div>}
    {success && <div className="success">{success}</div>}

    {/* Основная информация */}
    <section className="profile-section">
    <h2>Общая информация</h2>
    <div className="profile-info">
    <p><strong>Username:</strong> {profile.username}</p>
    <p><strong>Роль:</strong> {profile.role}</p>
    <p><strong>Зарегистрирован:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
    </div>
    </section>

    {/* Email */}
    <section className="profile-section">
    <h2>Email</h2>
    {!profile.email && (
      <p className="warning">⚠️ Email не указан. Добавьте для восстановления пароля.</p>
    )}

    {profile.email && !showEmailForm && (
      <div>
      <p>Текущий email: <strong>{profile.email}</strong></p>
      <button onClick={() => setShowEmailForm(true)} className="btn">Изменить</button>
      <button onClick={handleDeleteEmail} className="btn btn-danger">Удалить</button>
      </div>
    )}

    {(!profile.email || showEmailForm) && (
      <form onSubmit={handleUpdateEmail}>
      <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="your@email.com"
      required
      />
      <button type="submit" className="btn btn-primary">Сохранить</button>
      {showEmailForm && (
        <button type="button" onClick={() => setShowEmailForm(false)} className="btn">Отмена</button>
      )}
      </form>
    )}
    </section>

    {/* Смена пароля */}
    <section className="profile-section">
    <h2>Смена пароля</h2>
    {!showPasswordForm && (
      <button onClick={() => setShowPasswordForm(true)} className="btn">Изменить пароль</button>
    )}

    {showPasswordForm && (
      <form onSubmit={handleUpdatePassword}>
      <input
      type="password"
      value={oldPassword}
      onChange={(e) => setOldPassword(e.target.value)}
      placeholder="Текущий пароль"
      required
      />
      <input
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      placeholder="Новый пароль (мин. 8 символов)"
      required
      />
      <input
      type="password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      placeholder="Повтор нового пароля"
      required
      />
      <button type="submit" className="btn btn-primary">Изменить пароль</button>
      <button type="button" onClick={() => setShowPasswordForm(false)} className="btn">Отмена</button>
      </form>
    )}
    </section>

    {/* Аватары */}
    <section className="profile-section">
    <h2>Аватары {avatars.length}/50</h2>
    <div className="avatar-upload">
    <input
    type="file"
    accept="image/*"
    onChange={handleUploadAvatar}
    disabled={uploading || avatars.length >= 50}
    id="avatar-input"
    style={{ display: 'none' }}
    />
    <label
    htmlFor="avatar-input"
    className={`btn btn-primary ${(uploading || avatars.length >= 50) ? 'disabled' : ''}`}
    >
    {uploading ? '⏳ Загрузка...' : '📤 Загрузить аватар'}
    </label>
    {avatars.length >= 50 && (
      <p className="warning">⚠️ Достигнут лимит 50 аватаров</p>
    )}
    </div>

    <div className="avatars-grid">
    {avatars.map((avatar) => (
      <div key={avatar.avatarId} className={`avatar-item ${avatar.avatarId === activeAvatarId ? 'active' : ''}`}>
      <img src={avatar.dataUrl} alt="avatar" />
      {avatar.avatarId === activeAvatarId && (
        <span className="active-badge">✓ Активен</span>
      )}
      <div className="avatar-actions">
      {avatar.avatarId !== activeAvatarId && (
        <button onClick={() => handleSetActive(avatar.avatarId)} className="btn-small">
        Активировать
        </button>
      )}
      <button onClick={() => handleDeleteAvatar(avatar.avatarId)} className="btn-small btn-danger">
      Удалить
      </button>
      </div>
      </div>
    ))}
    </div>
    </section>
    </div>
  );
}

export default ProfileEdit;
