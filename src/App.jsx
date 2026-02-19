import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { usePushNotifications } from './hooks/usePushNotifications';
import Loader from './components/common/Loader';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import GameTournaments from './pages/GameTournaments';
import Wallet from './pages/Wallet';
import AddMoney from './pages/AddMoney';
import Withdraw from './pages/Withdraw';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import MyStats from './pages/MyStats';
import MyContests from './pages/MyContests';
import Lottery from './pages/Lottery';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Refer from './pages/Refer';
import StaticPage from './pages/StaticPage';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center">
        <Loader text="Loading..." />
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center">
        <Loader text="Loading..." />
      </div>
    );
  }

  return !currentUser ? children : <Navigate to="/" />;
}

// Notification handler - listens for real-time notifications
function NotificationHandler({ children }) {
  usePushNotifications(); // This hooks into Firestore real-time updates
  return children;
}

function AppRoutes() {
  return (
    <NotificationHandler>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/tournaments" element={<PrivateRoute><Tournaments /></PrivateRoute>} />
        <Route path="/tournament/:id" element={<PrivateRoute><TournamentDetail /></PrivateRoute>} />
        <Route path="/game/:id" element={<PrivateRoute><GameTournaments /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="/wallet/add" element={<PrivateRoute><AddMoney /></PrivateRoute>} />
        <Route path="/wallet/withdraw" element={<PrivateRoute><Withdraw /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/my-stats" element={<PrivateRoute><MyStats /></PrivateRoute>} />
        <Route path="/my-contests" element={<PrivateRoute><MyContests /></PrivateRoute>} />
        <Route path="/lottery" element={<PrivateRoute><Lottery /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/refer" element={<PrivateRoute><Refer /></PrivateRoute>} />

        {/* Static Pages */}
        <Route path="/terms" element={<PrivateRoute><StaticPage /></PrivateRoute>} />
        <Route path="/privacy" element={<PrivateRoute><StaticPage /></PrivateRoute>} />
        <Route path="/refund" element={<PrivateRoute><StaticPage /></PrivateRoute>} />
        <Route path="/fairplay" element={<PrivateRoute><StaticPage /></PrivateRoute>} />
        <Route path="/about" element={<PrivateRoute><StaticPage /></PrivateRoute>} />
        <Route path="/contact" element={<PrivateRoute><StaticPage /></PrivateRoute>} />
        <Route path="/faq" element={<PrivateRoute><StaticPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </NotificationHandler>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

