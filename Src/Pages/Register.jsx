import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Gift, Bell, BellRing, X } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

// Helper to detect iOS
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Check if notifications are supported
const isNotificationSupported = () => {
  if (typeof window === 'undefined') return false;
  if (isIOS()) return false; // iOS Safari doesn't support web push
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export default function Register() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Check and show notification permission popup
  useEffect(() => {
    // Check if notifications are supported
    if (!isNotificationSupported()) {
      console.log('Notifications not supported on this device');
      return;
    }

    // Get current permission status
    setNotificationPermission(Notification.permission);

    // Only show popup if permission is 'default' (not yet decided)
    if (Notification.permission !== 'default') {
      console.log('Notification permission already:', Notification.permission);
      return;
    }

    // Check if we already asked in this session
    const hasAskedBefore = sessionStorage.getItem('notification_permission_asked');
    if (hasAskedBefore) {
      console.log('Already asked for notification permission in this session');
      return;
    }

    // Show notification popup after 1.5 seconds
    const timer = setTimeout(() => {
      setShowNotificationPopup(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Handle notification permission request
  const handleEnableNotifications = async () => {
    try {
      // Mark that we've asked
      sessionStorage.setItem('notification_permission_asked', 'true');

      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      setNotificationPermission(permission);

      if (permission === 'granted') {
        // Show success notification
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive updates about tournaments and winnings.',
          icon: '/logo.jpeg'
        });

        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Firebase Messaging SW registered for push notifications');
          } catch (swError) {
            console.warn('SW registration failed:', swError);
          }
        }
      }

      // Hide the popup after handling
      setShowNotificationPopup(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowNotificationPopup(false);
    }
  };

  const handleDismissNotificationPopup = () => {
    sessionStorage.setItem('notification_permission_asked', 'true');
    setShowNotificationPopup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName, formData.referralCode);
      navigate('/');
    } catch (err) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = err.code || '';
      let errorMessage = 'Failed to create account. Please try again.';

      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        errorMessage = 'Registration is currently disabled. Try again later.';
      } else if (errorCode === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-500 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.jpeg" alt="Last Zone Legends" className="w-20 h-20 rounded-3xl mx-auto mb-4 object-cover" />
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-gray-400 mt-1">Join Last Zone Legends</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Enter your name"
              icon={User}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              icon={Mail}
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-dark-300 border border-dark-200 text-white placeholder-gray-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              icon={Lock}
              required
            />

            <Input
              label="Referral Code (Optional)"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
              placeholder="Enter referral code"
              icon={Gift}
            />

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Notification Permission Popup */}
      {showNotificationPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismissNotificationPopup}
          />

          {/* Popup */}
          <div className="relative w-full max-w-sm bg-gradient-to-br from-dark-400 to-dark-500 rounded-2xl border border-primary-500/30 shadow-2xl shadow-primary-500/20 animate-slide-up overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismissNotificationPopup}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-dark-300 hover:bg-dark-200 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
                  <BellRing className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Enable Notifications
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Get instant updates about tournaments, winnings, and exclusive offers!
              </p>

              {/* Features */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-400">🏆</div>
                  <div className="text-xs text-gray-500">Tournaments</div>
                </div>
                <div className="w-px bg-dark-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">💰</div>
                  <div className="text-xs text-gray-500">Winnings</div>
                </div>
                <div className="w-px bg-dark-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">🎁</div>
                  <div className="text-xs text-gray-500">Offers</div>
                </div>
              </div>

              {/* Enable Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleEnableNotifications}
                className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700"
              >
                <Bell className="w-5 h-5 mr-2" />
                Enable Notifications
              </Button>

              {/* Skip */}
              <button
                onClick={handleDismissNotificationPopup}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-400 mt-3 py-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

