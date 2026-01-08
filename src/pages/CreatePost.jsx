import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      const response = await postsAPI.create({
        title,
        content,
        tags: tagsArray
      });
      const postId = response.data.post?.postId || response.data.postId;
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
    <h1>Новая запись</h1>
    {error && <div className="error-message">{error}</div>}

    <form onSubmit={handleSubmit}>
    <div className="form-group">
    <label>Заголовок</label>
    <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
    maxLength={200}
    placeholder="Введите заголовок"
    />
    </div>

    <div className="form-group">
    <label>Содержание</label>
    <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    required
    placeholder="Введите текст заметки"
    />
    </div>

    <div className="form-group">
    <label>Теги (через запятую)</label>
    <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="например: песадь, плякадь, четадь, плякадь"
    />
    </div>

    <button type="submit" disabled={loading} className="btn btn-primary">
    {loading ? 'Сохранение...' : 'Написать'}
    </button>
    </form>
    </div>
  );
}
