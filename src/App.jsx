import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import { setAuthModalHandler } from './services/api';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostView from './pages/PostView';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import ProfileEdit from './pages/ProfileEdit';
import ReauthModal from './components/ReauthModal';
import './App.css';

function App() {
  const [showReauthModal, setShowReauthModal] = useState(false);

  useEffect(() => {
    setAuthModalHandler(() => {
      setShowReauthModal(true);
    });
  }, []);

  return (
    <AuthProvider>
    <Router>
    <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/posts/new" element={<CreatePost />} />
    <Route path="/posts/:postId" element={<PostView />} />
    <Route path="/posts/:postId/edit" element={<EditPost />} />
    <Route path="/profile/edit" element={<ProfileEdit />} />
    </Routes>

    {showReauthModal && (
      <ReauthModal onClose={() => setShowReauthModal(false)} />
    )}
    </Router>
    </AuthProvider>
  );
}

export default App;
