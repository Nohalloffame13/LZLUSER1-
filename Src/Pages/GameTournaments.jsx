import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowLeft, Trophy, Users, Clock, Gamepad2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function GameTournaments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live' },
    { value: 'finished', label: 'Finished' },
  ];

  const filteredTournaments = statusFilter === 'all'
    ? tournaments
    : tournaments.filter(t => t.status === statusFilter);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [gameSnap, tournamentsSnap] = await Promise.all([
        getDoc(doc(db, 'games', id)),
        getDocs(query(
          collection(db, 'tournaments'),
          where('gameId', '==', id),
          orderBy('startDateTime', 'asc')
        ))
      ]);

      if (gameSnap.exists()) {
        setGame({ id: gameSnap.id, ...gameSnap.data() });
      }
      setTournaments(tournamentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="font-semibold text-white">{game?.name || 'Game'} Tournaments</h1>
        </div>
      </div>

      {/* Game Banner */}
      {game && (
        <div className="aspect-video bg-dark-300 relative">
          {game.image ? (
            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-16 h-16 text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-500 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h2 className="text-2xl font-bold text-white">{game.name}</h2>
            <p className="text-gray-300">{tournaments.length} tournaments available</p>
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${statusFilter === option.value
                ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-dark-400 text-gray-400 hover:text-white hover:bg-dark-300'
                }`}
            >
              {option.label}
              {option.value !== 'all' && (
                <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${statusFilter === option.value
                  ? 'bg-white/20'
                  : 'bg-dark-300'
                  }`}>
                  {tournaments.filter(t => t.status === option.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredTournaments.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={statusFilter === 'all' ? 'No tournaments' : `No ${statusFilter} tournaments`}
            description={statusFilter === 'all'
              ? `No tournaments available for ${game?.name || 'this game'}`
              : `No ${statusFilter} tournaments for ${game?.name || 'this game'}`
            }
          />
        ) : (
          <div className="space-y-3.5">
            {filteredTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/tournament/${tournament.id}`} className="block">
                <Card className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white truncate">{tournament.name}</h3>
                      <Badge status={tournament.status} />
                    </div>

                    {/* Match Type & Map Badges */}
                    <div className="flex items-center gap-2 mt-2">
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

                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(tournament.startDateTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
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

