import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, Gift, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/lottery', icon: Gift, label: 'Lottery' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bottom-nav-shadow safe-bottom z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300
              ${isActive
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl" />
                )}
                <div
                  className={`relative p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30' : ''
                    }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

