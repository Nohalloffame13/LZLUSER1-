import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Trophy,
  Target,
  Coins,
  ChevronRight,
  LogOut,
  Edit2,
  Gift,
  FileText,
  Info,
  Download,
  BarChart3,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Profile() {
  const { userData, currentUser, logout, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    dateOfBirth: userData?.dateOfBirth || '',
  });

  // PWA Install prompt handler
  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, show instructions
      setInstallModalOpen(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setInstallModalOpen(false);
    }
  };

  const openInstallModal = () => {
    setInstallModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        updatedAt: serverTimestamp(),
      });
      await refreshUserData();
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { icon: BarChart3, label: 'My Stats', path: '/my-stats', color: 'text-primary-400' },
    { icon: Gift, label: 'Refer & Earn', path: '/refer', color: 'text-green-400' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', color: 'text-yellow-400' },
    { icon: FileText, label: 'Terms & Conditions', path: '/terms', color: 'text-blue-400' },
    { icon: FileText, label: 'Privacy Policy', path: '/privacy', color: 'text-purple-400' },
    { icon: FileText, label: 'Refund Policy', path: '/refund', color: 'text-red-400' },
    { icon: Shield, label: 'Fair Play Policy', path: '/fairplay', color: 'text-emerald-400' },
    { icon: Info, label: 'About Us', path: '/about', color: 'text-pink-400' },
    { icon: Phone, label: 'Contact Us', path: '/contact', color: 'text-orange-400' },
  ];

  return (
    <Layout>
      <div className="px-4 py-4 space-y-4">
        {/* Profile Header */}
        <Card className="relative">
          <button
            onClick={() => {
              setFormData({
                displayName: userData?.displayName || '',
                phone: userData?.phone || '',
                dateOfBirth: userData?.dateOfBirth || ''
              });
              setEditModalOpen(true);
            }}
            className="absolute top-4 right-4 p-2 bg-dark-200 rounded-full"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{userData?.displayName || 'User'}</h2>
              <p className="text-gray-400 text-sm">{userData?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm bg-green-500/20 text-green-400 border-green-500/30">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-dark-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary-400 mb-1">
                <Trophy className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-white">{userData?.matchesPlayed || 0}</p>
              <p className="text-xs text-gray-400">Matches</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-white">{userData?.totalKills || 0}</p>
              <p className="text-xs text-gray-400">Kills</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <Coins className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-green-400">{formatCurrency(userData?.totalWinnings || 0)}</p>
              <p className="text-xs text-gray-400">Won</p>
            </div>
          </div>
        </Card>

        {/* User Info */}
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-white">{userData?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-white">{userData?.phone || 'Not added'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-white">{formatDate(userData?.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Referral Code</p>
              <p className="text-primary-400 font-mono">{userData?.referralCode || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="divide-y divide-dark-200">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
          ))}
        </Card>

        {/* Download App Button */}
        <a
          href="/LastZone.apk"
          download="LastZone.apk"
          className="block"
        >
          <Button
            variant="primary"
            fullWidth
            icon={Download}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Download App
          </Button>
        </a>

        {/* Logout */}
        <Button
          variant="danger"
          fullWidth
          icon={LogOut}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleSave}>
          <Input
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 9876543210"
          />
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <Button type="submit" fullWidth loading={saving} className="mt-4">
            Save Changes
          </Button>
        </form>
      </Modal>

      {/* Install App Modal */}
      <Modal isOpen={installModalOpen} onClose={() => setInstallModalOpen(false)} title="Install App">
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <Download className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">Install Last Zone</h3>
          <p className="text-gray-400 text-sm mb-4">Get the best experience with our app!</p>

          <div className="bg-dark-300 rounded-xl p-4 mb-4 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-sm text-gray-300">Quick access to tournaments</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-gray-300">Instant notifications for winnings</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-gray-300">Faster & smoother experience</span>
            </div>
          </div>

          {deferredPrompt ? (
            <Button fullWidth onClick={handleInstallApp} className="bg-gradient-to-r from-green-500 to-emerald-600">
              <Download className="w-5 h-5 mr-2" />
              Install Now
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">To install, tap the menu button in your browser and select "Add to Home Screen"</p>
              <Button fullWidth variant="secondary" onClick={() => setInstallModalOpen(false)}>
                Got it!
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}

