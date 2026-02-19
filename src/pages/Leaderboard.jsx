import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowLeft, Trophy, Medal, Crown } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Tabs from '../components/common/Tabs';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users'), orderBy('totalWinnings', 'desc'), limit(100))
      );
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: 'all', label: 'All Time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
    return 'bg-dark-400';
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
          <h1 className="font-semibold text-white">Leaderboard</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

        {players.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No players yet"
            description="Be the first to top the leaderboard!"
          />
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => {
              const rank = index + 1;
              return (
                <Card key={player.id} className={`flex items-center gap-3 border ${getRankBg(rank)}`}>
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getRankIcon(rank) || (
                      <span className="text-lg font-bold text-gray-500">#{rank}</span>
                    )}
                  </div>
                  
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {player.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{player.displayName || 'Unknown'}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{player.matchesPlayed || 0} matches</span>
                      <span>{player.totalKills || 0} kills</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{formatCurrency(player.totalWinnings || 0)}</p>
                    <p className="text-xs text-gray-500">Won</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

