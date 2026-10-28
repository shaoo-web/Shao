import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext.jsx';
import Layout from './components/Layout.jsx';

// Public pages
import Home from './pages/Home.jsx';
import PostDetail from './pages/PostDetail.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import TagPage from './pages/TagPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import CvPage from './pages/CvPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

// Admin components & pages
import Login from './pages/admin/Login.jsx';
import RequireAdmin from './components/admin/RequireAdmin.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import PostsAdmin from './pages/admin/PostsAdmin.jsx';
import PostEditor from './pages/admin/PostEditor.jsx';
import AdsAdmin from './pages/admin/AdsAdmin.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Login */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/posts" element={<PostsAdmin />} />
              <Route path="/admin/posts/new" element={<PostEditor />} />
              <Route path="/admin/posts/edit/:id" element={<PostEditor />} />
              <Route path="/admin/ads" element={<AdsAdmin />} />
            </Route>
          </Route>

          {/* Public Routes with standard Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/tag/:slug" element={<TagPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cv" element={<CvPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Catch-all to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
