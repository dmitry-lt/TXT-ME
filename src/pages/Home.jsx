import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import signofImage from '../assets/signof.jpeg';


// Маппинг ролей на греческие буквы
const getRoleDisplay = (role) => {
  const roleMap = {
    'NASTOIATEL': '✨ ΝΑΣΤΩΙΑΤΕΛ',
    'SMOTRITEL': '✨ ΣΜΩΤΡΙΤΕΛ',
    'AVTOR': '✨ ΑΘΤΩΡ',
    'KOMMENTATOR': 'ΚΩΜΜΕΝΤΑΤΩΡ'
  };
  return roleMap[role] || role;
};

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getAll({ limit: 50 });
      const postsData = response.data.posts || [];

      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          try {
            const commentsResponse = await commentsAPI.getByPost(post.postId);
            const totalComments = commentsResponse.data.comments?.length || 0;
            return { ...post, totalComments };
          } catch (error) {
            return { ...post, totalComments: 0 };
          }
        })
      );

      setPosts(postsWithComments);

      const tags = new Set();
      const authors = new Set();
      postsWithComments.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            // Нормализуем метку - убираем # если есть
            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
            tags.add(cleanTag);
          });
        }
        if (post.username) {
          authors.add(post.username);
        }
      });

      setAllTags(Array.from(tags));
      setAllAuthors(Array.from(authors));
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleAuthor = (author) => {
    setSelectedAuthors(prev =>
    prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]
    );
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Ссылка скопирована в буфер обмена!');
    }).catch(() => {
      alert('Не удалось скопировать ссылку');
    });
  };

  const filteredPosts = posts.filter(post => {
    if (selectedTags.length > 0 && (!post.tags || !selectedTags.some(tag => post.tags.includes(tag)))) {
      return false;
    }
    if (selectedAuthors.length > 0 && !selectedAuthors.includes(post.username)) {
      return false;
    }
    return true;
  });

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="main-container">
    {/* КНОПКА РАЗВЕРНУТЬ/СВЕРНУТЬ (только мобильная версия) */}
    <button
    className="expand-toggle mobile-only"
    onClick={() => setSidebarExpanded(!sidebarExpanded)}
    >
    {sidebarExpanded ? '← Свернуть панель управления' : 'Развернуть панель управления'}
    </button>

    {/* ЛЕНТА ПОСТОВ */}
    <div className="feed">
    {filteredPosts.length === 0 ? (
      <div className="no-posts">Нет заметок</div>
    ) : (
      filteredPosts.map(post => (
        <div key={post.postId} className="post-card">
        <div className="post-header">
        <Link to={`/posts/${post.postId}`} style={{ textDecoration: 'none' }}>
        <h2 className="post-title">{post.title}</h2>
        </Link>
        <div className="post-meta">
        <span>{post.username}</span>
        <span>•</span>
        <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
        </div>

        <div className="post-content-wrapper">
        {/* ПОЛНЫЙ ТЕКСТ БЕЗ ОБРЕЗКИ */}
        <div className="post-content">{post.content}</div>
        </div>

        {/* ФУТЕР С ТЕГАМИ И ВСЕМИ ССЫЛКАМИ */}
        <div className="post-footer">
        {/* ВСЕ ТЕГИ */}
        {post.tags && post.tags.map((tag, idx) => (
          <Link
          key={idx}
          to={`/?tag=${encodeURIComponent(tag)}`}
          className="post-tag"
          >
          #{tag}
          </Link>
        ))}

        {/* ВСЕ ССЫЛКИ */}
        <div className="post-actions">
        <Link to={`/posts/${post.postId}#comment-form`} className="post-comment-link">
        💬 Оставить комментарий
        </Link>
        <Link to={`/posts/${post.postId}#comments-section`} className="post-comment-link">
        📝 {post.totalComments || 0} {post.totalComments === 1 ? 'комментарий' : 'комментариев'}
        </Link>
        <button
        onClick={() => handleShare(post.postId)}
        className="post-comment-link"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
        🔗 Share
        </button>
        <span className="post-comment-link" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
        🚩 Flag
        </span>
        </div>
        </div>
        </div>
      ))
    )}
    </div>

    {/* САЙДБАР */}
    <aside className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
    {/* КНОПКА СВЕРНУТЬ В МОБИЛЬНОЙ ВЕРСИИ */}
    <button
    className="collapse-toggle mobile-only"
    onClick={() => setSidebarExpanded(false)}
    >
    ← Свернуть панель управления
    </button>

    {/* КНОПКА НОВАЯ ЗАПИСЬ */}
    {user && (
      <Link to="/posts/new" className="new-post-btn">
      + Новая запись
      </Link>
    )}

    {/* БЛОК КЛУБА */}
    <div className="club-block">
    <img
    src={signofImage}
    alt="TXT-ME CLUB"
    className="club-icon"
    style={{ objectFit: 'cover' }}
    />
    <h2>TXT-ME CLUB</h2>
    </div>


    {/* ПОЛЬЗОВАТЕЛЬ С ГОЛОВАСТИКОМ */}
    <div className="user-section">
    {user ? (
      <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
      {/* ГОЛОВАСТИК ВМЕСТО БУКВЫ */}
      <div className="user-avatar">👤</div>
      <div>
      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{user.username}</div>
      <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
      {getRoleDisplay(user.role)}
      </div>
      </div>
      </div>
      <Link to="/profile/edit" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem', textAlign: 'center' }}>
      Профиль
      </Link>
      <button onClick={logout} className="btn btn-primary" style={{ width: '100%' }}>
      Выйти
      </button>
      </div>
    ) : (
      <div className="auth-buttons">
      <Link to="/login" className="btn btn-primary">Войти</Link>
      <Link to="/register" className="btn">Регистрация</Link>
      </div>
    )}
    </div>


    {/* ФИЛЬТРЫ */}
    <div className="filters-section">
    <div className="filter-group">
    <div className="filter-label">Теги</div>
    {allTags.length > 0 && (
      <div className="filter-options">
      {allTags.map(tag => (
        <div
        key={tag}
        className="filter-option"
        onClick={() => toggleTag(tag)}
        >
        <input
        type="checkbox"
        className="checkbox"
        checked={selectedTags.includes(tag)}
        readOnly
        />
        {tag}
        </div>
      ))}
      </div>
    )}
    </div>

    <div className="filter-group">
    <div className="filter-label">Авторы</div>
    {allAuthors.length > 0 && (
      <div className="filter-options">
      {allAuthors.map(author => (
        <div
        key={author}
        className="filter-option"
        onClick={() => toggleAuthor(author)}
        >
        <input
        type="checkbox"
        className="checkbox"
        checked={selectedAuthors.includes(author)}
        readOnly
        />
        {author}
        </div>
      ))}
      </div>
    )}
    </div>
    </div>
    </aside>
    </div>
  );
}
