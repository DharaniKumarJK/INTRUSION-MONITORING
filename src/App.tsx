import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { Shield, LogOut, Brain, Sun, Moon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import TensorFlowDemo from './components/TensorFlowDemo';
import SpacyDemo from './components/SpacyDemo';
import { RegisteredUsers } from './components/RegisteredUsers';
import { ActiveRestrictions } from './components/ActiveRestrictions';
import api, { UserProfile, Restriction } from './lib/api';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (profile?.role === 'admin') {
      fetchAdminData();
      interval = setInterval(fetchAdminData, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      const [usersRes, restrictionsRes] = await Promise.all([
        api.get('/users'),
        api.get('/restrictions')
      ]);
      setUsers(usersRes.data);
      setRestrictions(restrictionsRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center dark:from-black dark:via-slate-900 dark:to-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm mode={authMode} onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-800 shadow-md border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Security Monitor</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profile.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{profile.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile.role}</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                AI & NLP Integration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Explore the power of machine learning with TensorFlow.js and NLP with spaCy.
              </p>
              <div className="space-y-6">
                <TensorFlowDemo />
                <SpacyDemo />
              </div>
            </div>
            {profile.role === 'admin' && (
              <>
                <RegisteredUsers users={users} />
                <ActiveRestrictions restrictions={restrictions} />
              </>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">System Dashboard</h2>
            {profile.role === 'admin' ? <AdminDashboard users={users} /> : <UserDashboard />}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
