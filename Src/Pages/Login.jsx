import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Download, X, Smartphone, Bell, BellRing } from 'lucide-react';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { login } = useAuth();
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

  useEffect(() => {
    // Check if running as installed app (PWA/standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true  // iOS Safari
      || document.referrer.includes('android-app://'); // Android TWA

    // Show install popup after 3 seconds only if NOT running as installed app
    // and only if notification popup is not showing
    if (!isStandalone) {
      const timer = setTimeout(() => {
        if (!showNotificationPopup) {
          setShowInstallPopup(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotificationPopup]);

  const handleDismissPopup = () => {
    setShowInstallPopup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Convert Firebase errors to user-friendly messages
      const errorCode = err.code || '';
      let errorMessage = 'Failed to login. Please try again.';

      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password. Please try again.';
      } else if (errorCode === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorCode === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Contact support.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
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
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-gray-400 mt-1">Sign in to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <Link to="/forgot-password" className="text-primary-400 text-sm block text-right mb-6">
              Forgot Password?
            </Link>

            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 font-medium">
              Sign Up
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

      {/* Install App Popup */}
      {showInstallPopup && !showNotificationPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismissPopup}
          />

          {/* Popup */}
          <div className="relative w-full max-w-sm bg-gradient-to-br from-dark-400 to-dark-500 rounded-2xl border border-primary-500/30 shadow-2xl shadow-primary-500/20 animate-slide-up overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismissPopup}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-dark-300 hover:bg-dark-200 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl" />

            <div className="relative p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Download Our App
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Get the best experience with our Android app. Faster, smoother, and always accessible!
              </p>

              {/* Features */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">Fast</div>
                  <div className="text-xs text-gray-500">Loading</div>
                </div>
                <div className="w-px bg-dark-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">Easy</div>
                  <div className="text-xs text-gray-500">Access</div>
                </div>
                <div className="w-px bg-dark-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">Free</div>
                  <div className="text-xs text-gray-500">Forever</div>
                </div>
              </div>

              {/* Download Button */}
              <a
                href="/LastZone.apk"
                download="LastZone.apk"
                className="block"
                onClick={() => setShowInstallPopup(false)}
              >
                <Button
                  fullWidth
                  size="lg"
                  icon={Download}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  Download APK
                </Button>
              </a>

              {/* Skip */}
              <button
                onClick={handleDismissPopup}
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

