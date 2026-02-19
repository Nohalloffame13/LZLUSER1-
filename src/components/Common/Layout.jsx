import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function Layout({ children, hideHeader = false, hideNav = false }) {
  // Initialize push notification listener globally
  usePushNotifications();

  return (
    <div className="min-h-screen bg-dark-500 flex flex-col">
      {!hideHeader && <Header />}

      <main className={`flex-1 ${!hideNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
}

