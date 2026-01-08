import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';

export default function EditPost() {
  const { postId } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // ДОБАВЛЕНО: useRef для отслеживания, были ли уже загружены данные
  const isDataLoaded = useRef(false);

  useEffect(() => {
    if (!authLoading && user) {
      // ИЗМЕНЕНО: загружаем только если данные еще не загружены
      if (!isDataLoaded.current) {
        loadPost();
      }
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [postId, user, authLoading]);

  const loadPost = async () => {
    try {
      const response = await postsAPI.getById(postId);
      const post = response.data.post;

      if (user.userId !== post.userId) {
        navigate('/');
        return;
      }

      setTitle(post.title);
      setContent(post.content);
      setTags(post.tags ? post.tags.join(', ') : '');

      // ДОБАВЛЕНО: помечаем, что данные загружены
      isDataLoaded.current = true;
    } catch (error) {
      console.error('Failed to load post:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      await postsAPI.update(postId, {
        title,
        content,
        tags: tagsArray
      });
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post');
    }
  };

  if (authLoading || loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="edit-post">
    <h1>Редактировать заметку</h1>
    <form onSubmit={handleSubmit}>
    <div className="form-group">
    <label>Заголовок</label>
    <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
    maxLength={200}
    />
    </div>
    <div className="form-group">
    <label>Содержание</label>
    <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    required
    rows={15}
    maxLength={40000}
    />
    </div>
    <div className="form-group">
    <label>Метки (через запятую)</label>
    <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="песадь, четадь"
    />
    </div>
    {error && <div className="error">{error}</div>}
    <div className="form-actions">
    <button type="submit">Сохранить</button>
    <button type="button" onClick={() => navigate(`/posts/${postId}`)}>
    Отмена
    </button>
    </div>
    </form>
    </div>
  );
}
