import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Account from './pages/Account';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';

function App() {
  const { isDarkMode } = useThemeStore();

  // This watches the global state and updates the entire website instantly
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      {/* We use standard Tailwind classes for a full-screen, clean background */}
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Routes>
          {/* Define our specific routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetails />} />
          <Route path="/account" element={<Account />} />
          
          {/* Catch-all: If a user visits an unknown URL, send them to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;