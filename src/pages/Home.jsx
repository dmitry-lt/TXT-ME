import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AvatarDisplay from '../components/AvatarDisplay';
import signofImage from '../assets/signof.jpeg';

const getRoleDisplay = (role) => {
  const roleMap = {
    'NASTOIATEL': 'Настоятель',
    'SMOTRITEL': 'Смотритель',
    'AVTOR': 'Автор',
    'KOMMENTATOR': 'Комментатор'
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

  // Состояния для пагинации
  const [nextKey, setNextKey] = useState(null); // Ключ для получения более старых постов
  const [history, setHistory] = useState([]); // Стек ключей для возврата к новым
  const [currentKey, setCurrentKey] = useState(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (targetKey = null, isReturningToNewer = false) => {
    try {
      setLoading(true);
      const params = { limit: 10 };
      if (targetKey) params.lastKey = targetKey;

      const response = await postsAPI.getAll(params);
      const postsData = response.data.posts;
      const newNextKey = response.data.nextKey;

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
      setNextKey(newNextKey);

      // Логика истории пагинации
      if (isReturningToNewer) {
        setHistory(prev => prev.slice(0, -1));
      } else if (currentKey !== targetKey) {
        // Запоминаем текущий ключ перед переходом на более старую страницу
        if (currentKey !== undefined) {
          setHistory(prev => [...prev, currentKey]);
        }
      }

      setCurrentKey(targetKey);

      // Собираем теги и авторов из текущей пачки
      const tags = new Set();
      const authors = new Set();
      postsWithComments.forEach((post) => {
        if (post.tags) {
          post.tags.forEach((tag) => {
            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
            tags.add(cleanTag);
          });
        }
        if (post.username) authors.add(post.username);
      });
      setAllTags(Array.from(tags));
      setAllAuthors(Array.from(authors));

      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToOlder = () => {
    if (nextKey) loadPosts(nextKey, false);
  };

  const handleGoToNewer = () => {
    if (history.length > 0) {
      const prevKey = history[history.length - 1];
      loadPosts(prevKey, true);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAuthor = (author) => {
    setSelectedAuthors((prev) =>
        prev.includes(author) ? prev.filter((a) => a !== author) : [...prev, author]
    );
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url)
        .then(() => alert('Ссылка скопирована!'))
        .catch(() => alert('Ошибка копирования'));
  };

  const filteredPosts = posts.filter((post) => {
    if (selectedTags.length > 0) {
      if (!post.tags || !selectedTags.some((tag) => post.tags.includes(tag))) {
        return false;
      }
    }
    if (selectedAuthors.length > 0) {
      if (!selectedAuthors.includes(post.username)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return <div className="loading">...</div>;
  }

  return (
      <div className="main-container">
        <button
            className="expand-toggle mobile-only"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
        >
          {sidebarExpanded ? '←' : '→'}
        </button>

        <div className="feed">
          {/* Верхняя навигация */}
          <div className="post-navigation" style={{ marginBottom: '2rem' }}>
            {history.length > 0 ? (
                <button onClick={handleGoToNewer} className="nav-link">← Предыдущая страница</button>
            ) : <div />}

            <Link to="/" onClick={() => { setHistory([]); loadPosts(null); }} className="nav-link center">
              В начало
            </Link>

            {nextKey ? (
                <button onClick={handleGoToOlder} className="nav-link">Следующая страница →</button>
            ) : <div />}
          </div>

          {filteredPosts.length === 0 ? (
              <div className="no-posts">
                <div>Нет постов</div>
              </div>
          ) : (
              filteredPosts.map((post) => (
                  <div key={post.postId} className="post-fullwidth">
                    <div className="post-header-full">
                      <div className="post-avatar-small">
                        <AvatarDisplay
                            userId={post.userId}
                            avatarId={post.postAvatarId}
                            username={post.username}
                            size={50}
                        />
                      </div>
                      <div className="post-header-right">
                        <Link to={`/posts/${post.postId}`} style={{ textDecoration: 'none' }}>
                          <h2 className="post-title">{post.title}</h2>
                        </Link>
                        <div className="post-meta">
                          <span>{post.username}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="post-content-full">
                      <MarkdownRenderer content={post.content} postId={post.postId} />
                    </div>

                    <div className="post-footer-full">
                      {post.tags &&
                          post.tags.map((tag, idx) => (
                              <Link
                                  key={idx}
                                  to={`/?tag=${encodeURIComponent(tag)}`}
                                  className="post-tag"
                              >
                                {tag}
                              </Link>
                          ))}
                      <div className="post-actions-full">
                        <Link to={`/posts/${post.postId}#comment-form`} className="post-comment-link">
                          Написать комментарий
                        </Link>
                        <Link to={`/posts/${post.postId}#comments-section`} className="post-comment-link">
                          {post.totalComments === 0
                              ? 'Комментарии'
                              : post.totalComments === 1
                                  ? '1 комментарий'
                                  : `${post.totalComments} комментариев`}
                        </Link>
                        <button onClick={() => handleShare(post.postId)} className="post-share-btn">
                          Поделиться
                        </button>
                        <span className="post-flag-placeholder">Флаг</span>
                      </div>
                    </div>
                  </div>
              ))
          )}

          {/* Нижняя навигация */}
          <div className="post-navigation" style={{ marginTop: '2rem' }}>
            {history.length > 0 ? (
                <button onClick={handleGoToNewer} className="nav-link">← Вперед</button>
            ) : <div />}

            <span className="nav-link center" style={{ opacity: 0.7 }}>
            Страница {history.length + 1}
          </span>

            {nextKey ? (
                <button onClick={handleGoToOlder} className="nav-link">Назад →</button>
            ) : <div />}
          </div>
        </div>

        <aside className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
          {user ? (
              <Link to="/posts/new" className="new-post-btn">
                Новый пост
              </Link>
          ) : null}

          <div className="club-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={signofImage} alt="TXT-ME CLUB" className="club-icon" style={{ objectFit: 'cover' }} />
              <h2 style={{ margin: 0 }}>TXT-ME CLUB</h2>
            </div>
          </div>

          <div className="user-section">
            {user ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <AvatarDisplay
                        userId={user.userId}
                        avatarId={user.activeAvatarId}
                        username={user.username}
                        size={48}
                    />
                    <div style={{ marginLeft: '0.75rem' }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{user.username}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {getRoleDisplay(user.role)}
                      </div>
                    </div>
                  </div>
                  <Link to="/profile/edit" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Редактировать профиль
                  </Link>
                  <button onClick={logout} className="btn btn-primary" style={{ width: '100%' }}>Выйти</button>
                </div>
            ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-primary">Войти</Link>
                  <Link to="/register" className="btn">Регистрация</Link>
                </div>
            )}
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <div className="filter-label">Теги</div>
              {allTags.length > 0 && (
                  <div className="filter-options">
                    {allTags.map((tag) => (
                        <div key={tag} className="filter-option" onClick={() => toggleTag(tag)}>
                          <input type="checkbox" className="checkbox" checked={selectedTags.includes(tag)} readOnly />
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
                    {allAuthors.map((author) => (
                        <div key={author} className="filter-option" onClick={() => toggleAuthor(author)}>
                          <input type="checkbox" className="checkbox" checked={selectedAuthors.includes(author)} readOnly />
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