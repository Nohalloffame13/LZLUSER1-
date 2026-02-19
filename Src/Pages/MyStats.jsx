import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Trophy,
  Target,
  Coins,
  Gamepad2,
  TrendingUp,
  Calendar,
  Award,
  Zap,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function MyStats() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const [transSnap, tournamentSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          )
        ),
        getDocs(
          query(
            collection(db, 'tournaments'),
            where('participants', 'array-contains', currentUser.uid)
          )
        ),
      ]);

      setTransactions(transSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setTournaments(tournamentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalDeposited = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalEntryFees = transactions
    .filter((t) => t.type === 'entry_fee')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWinnings = transactions
    .filter((t) => t.type === 'winning' || t.type === 'bonus')
    .reduce((sum, t) => sum + t.amount, 0);

  const wonTournaments = tournaments.filter((t) => t.status === 'finished').length;
  const upcomingTournaments = tournaments.filter((t) => t.status === 'upcoming').length;
  const liveTournaments = tournaments.filter((t) => t.status === 'live').length;

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
          <h1 className="font-semibold text-white">My Stats</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Profile Summary */}
        <Card className="bg-gradient-to-br from-primary-600 to-purple-600">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{userData?.displayName}</h2>
              <p className="text-white/70 text-sm">Member since {formatDate(userData?.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{userData?.matchesPlayed || 0}</p>
              <p className="text-xs text-white/70">Matches</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{userData?.totalKills || 0}</p>
              <p className="text-xs text-white/70">Kills</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Coins className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(userData?.totalWinnings || 0)}
              </p>
              <p className="text-xs text-white/70">Won</p>
            </div>
          </div>
        </Card>

        {/* Tournament Stats */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary-400" />
            Tournament Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-dark-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{tournaments.length}</p>
                  <p className="text-xs text-gray-400">Total Joined</p>
                </div>
              </div>
            </Card>
            <Card className="bg-dark-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{wonTournaments}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
              </div>
            </Card>
            <Card className="bg-dark-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{liveTournaments}</p>
                  <p className="text-xs text-gray-400">Live Now</p>
                </div>
              </div>
            </Card>
            <Card className="bg-dark-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{upcomingTournaments}</p>
                  <p className="text-xs text-gray-400">Upcoming</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Financial Stats */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Financial Stats
          </h3>
          <Card className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-dark-200">
              <span className="text-gray-400">Total Deposited</span>
              <span className="text-green-400 font-semibold">{formatCurrency(totalDeposited)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-200">
              <span className="text-gray-400">Total Withdrawn</span>
              <span className="text-red-400 font-semibold">{formatCurrency(totalWithdrawn)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-200">
              <span className="text-gray-400">Entry Fees Paid</span>
              <span className="text-orange-400 font-semibold">{formatCurrency(totalEntryFees)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-200">
              <span className="text-gray-400">Total Winnings</span>
              <span className="text-green-400 font-semibold">{formatCurrency(totalWinnings)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white font-medium">Net Profit/Loss</span>
              <span
                className={`font-bold text-lg ${
                  totalWinnings - totalEntryFees >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {totalWinnings - totalEntryFees >= 0 ? '+' : ''}
                {formatCurrency(totalWinnings - totalEntryFees)}
              </span>
            </div>
          </Card>
        </div>

        {/* Wallet Balance */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary-400" />
            Current Balance
          </h3>
          <Card className="bg-dark-400">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Deposited</p>
                <p className="text-lg font-bold text-blue-400">
                  {formatCurrency(userData?.depositedBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Winnings</p>
                <p className="text-lg font-bold text-green-400">
                  {formatCurrency(userData?.winningBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Bonus</p>
                <p className="text-lg font-bold text-purple-400">
                  {formatCurrency(userData?.bonusBalance || 0)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-200 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(userData?.walletBalance || 0)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

