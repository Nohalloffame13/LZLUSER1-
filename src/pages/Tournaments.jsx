import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Trophy, Users, Clock, Gamepad2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Tabs from '../components/common/Tabs';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'tournaments'), orderBy('startDateTime', 'asc')));
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live' },
    { value: 'finished', label: 'Finished' }
  ];

  const filteredTournaments = activeTab === 'all'
    ? tournaments
    : tournaments.filter(t => t.status === activeTab);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader text="Loading tournaments..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-white mb-4">Tournaments</h1>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

        {filteredTournaments.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No tournaments found"
            description={`No ${activeTab === 'all' ? '' : activeTab} tournaments available`}
          />
        ) : (
          <div className="space-y-3">
            {filteredTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
                <Card className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-200 flex-shrink-0">
                    {tournament.gameImage ? (
                      <img src={tournament.gameImage} alt={tournament.gameName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white truncate">{tournament.name}</h3>
                        <p className="text-sm text-gray-400">{tournament.gameName}</p>
                      </div>
                      <Badge status={tournament.status} />
                    </div>

                    {/* Match Type & Map Badges */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {tournament.matchType && (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${tournament.matchType === 'squad' ? 'bg-purple-500/20 text-purple-400' :
                            tournament.matchType === 'duo' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                          }`}>
                          {tournament.matchType}
                        </span>
                      )}
                      {tournament.map && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                          {tournament.map}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(tournament.startDateTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Entry: <span className="text-white">{formatCurrency(tournament.entryFee)}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          <Users className="w-3 h-3 inline mr-1" />
                          {tournament.participantCount || 0}/{tournament.maxPlayers || '∞'}
                        </span>
                      </div>
                      <span className="text-green-400 font-semibold">{formatCurrency(tournament.prizePool)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

