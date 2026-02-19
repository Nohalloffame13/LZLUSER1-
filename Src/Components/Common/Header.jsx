import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';

export default function Header() {
  const { userData } = useAuth();

  return (
    <header className="sticky top-0 z-40 gradient-header safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.jpeg"
            alt="Last Zone Legends"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/20"
          />
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Last Zone</h1>
            <p className="text-[10px] text-white/70">Legends</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/20 transition-all"
          >
            <Wallet className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">
              {formatCurrency(userData?.walletBalance || 0)}
            </span>
          </Link>

          <Link
            to="/notifications"
            className="relative p-2.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/20 transition-all"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </Link>
        </div>
      </div>
    </header>
  );
}

