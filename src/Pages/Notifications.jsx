import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Bell, Megaphone, BellRing } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatTimeAgo } from '../utils/formatters';

export default function Notifications() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const lastNotificationRef = useRef(null);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    fetchNotifications();

    // Set up real-time listener for new notifications
    const unsubscribe = onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1)),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = { id: change.doc.id, ...change.doc.data() };

            // Check if this is a new notification (not initial load)
            if (lastNotificationRef.current &&
              notification.id !== lastNotificationRef.current &&
              notification.sendPush) {
              // Show browser notification
              showBrowserNotification(notification);
            }

            lastNotificationRef.current = notification.id;
          }
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50))
      );
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);

      if (notifs.length > 0) {
        lastNotificationRef.current = notifs[0].id;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive updates about tournaments and winnings.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const showBrowserNotification = (notification) => {
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: notification.id,
          requireInteraction: true
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };

  if (loading) {
    return (
      <Layout hideNav>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-dark-500 border-b border-dark-300">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-300 rounded-full">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-semibold text-white">Notifications</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Notification Permission Banner */}
        {notificationPermission === 'default' && (
          <Card className="mb-4 bg-gradient-to-r from-primary-500/20 to-purple-500/20 border-primary-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <BellRing className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">Enable Push Notifications</h3>
                <p className="text-sm text-gray-400">Get instant updates about tournaments, winnings, and more!</p>
              </div>
            </div>
            <Button
              fullWidth
              onClick={requestNotificationPermission}
              className="mt-4 bg-gradient-to-r from-primary-500 to-purple-500"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          </Card>
        )}

        {notificationPermission === 'denied' && (
          <Card className="mb-4 bg-red-500/10 border-red-500/30">
            <p className="text-sm text-red-400">
              ⚠️ Notifications are blocked. To receive updates, please enable notifications in your browser settings.
            </p>
          </Card>
        )}

        {notificationPermission === 'granted' && (
          <div className="mb-4 flex items-center gap-2 text-green-400 text-sm">
            <Bell className="w-4 h-4" />
            <span>Push notifications enabled</span>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up!"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className="flex gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white">{notification.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatTimeAgo(notification.createdAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

