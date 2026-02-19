import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { User, Wallet, Trophy, Phone, ChevronRight, Gamepad2, Calendar } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function Home() {
  const { currentUser } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [games, setGames] = useState([]);
  const [myContests, setMyContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Try to fetch games with orderBy (requires Firestore index)
      let gamesData = [];
      try {
        const gamesSnap = await getDocs(
          query(collection(db, 'games'), orderBy('displayOrder', 'asc'))
        );
        gamesData = gamesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (gamesError) {
        // Fallback: fetch without ordering and sort client-side
        console.warn('Falling back to client-side sorting for games');
        const gamesSnap = await getDocs(collection(db, 'games'));
        gamesData = gamesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        gamesData.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      }

      const [promoSnap, tournamentsSnap] = await Promise.all([
        getDocs(
          query(collection(db, 'promotions'), where('isActive', '==', true), orderBy('order', 'asc'))
        ),
        getDocs(query(collection(db, 'tournaments'), orderBy('startDateTime', 'desc'))),
      ]);

      setPromotions(promoSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setGames(gamesData);

      // Filter tournaments where user has participated
      const allTournaments = tournamentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const userContests = currentUser
        ? allTournaments.filter(t => t.participantDetails?.some(p => p.odeuUserId === currentUser.uid))
        : [];
      setMyContests(userContests);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: User, label: 'My Profile', path: '/profile', color: 'from-blue-500 to-cyan-500' },
    { icon: Wallet, label: 'My Wallet', path: '/wallet', color: 'from-green-500 to-emerald-500' },
    { icon: Trophy, label: 'Top Players', path: '/leaderboard', color: 'from-yellow-500 to-orange-500' },
    { icon: Phone, label: 'Contact Us', path: '/contact', color: 'from-purple-500 to-pink-500' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader text="Loading..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-4 space-y-6">
        {/* Promotion Banner Slider */}
        {promotions.length > 0 && (
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {promotions.map((promo) => (
                <div key={promo.id} className="w-[85vw] max-w-sm flex-shrink-0">
                  <a
                    href={promo.link || '#'}
                    target={promo.link ? "_blank" : "_self"}
                    rel={promo.link ? "noopener noreferrer" : ""}
                    className={`block aspect-[2/1] rounded-2xl overflow-hidden bg-dark-300 relative group ${!promo.link && 'cursor-default'}`}
                    onClick={(e) => !promo.link && e.preventDefault()}
                  >
                    {promo.image ? (
                      <img
                        src={promo.image}
                        alt="Promotion"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-pulse-slow" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-active:scale-95`}
                style={{ boxShadow: `0 8px 20px ${action.color.includes('blue') ? 'rgba(59,130,246,0.3)' : action.color.includes('green') ? 'rgba(16,185,129,0.3)' : action.color.includes('yellow') ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.3)'}` }}
              >
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-gray-400 text-center group-hover:text-white transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>

        {/* My Contests */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              My Contests
            </h2>
            <Link
              to="/my-contests"
              className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {!currentUser ? (
            <Card className="text-center py-8" glow>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-gray-400">Login to see your contests</p>
              <Link
                to="/login"
                className="text-primary-400 text-sm mt-2 inline-block hover:text-primary-300"
              >
                Login now →
              </Link>
            </Card>
          ) : myContests.length === 0 ? (
            <Card className="text-center py-8" glow>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-gray-400">You haven't joined any contests yet</p>
              <Link
                to="/tournaments"
                className="text-primary-400 text-sm mt-2 inline-block hover:text-primary-300"
              >
                Join a tournament →
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {myContests.slice(0, 3).map((contest, index) => (
                <Link key={contest.id} to={`/tournament/${contest.id}`}>
                  <Card
                    className="flex items-center gap-3 hover:border-primary-500/30 transition-all duration-300"
                    glow
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-200 flex-shrink-0 ring-2 ring-white/10">
                      {contest.gameImage ? (
                        <img
                          src={contest.gameImage}
                          alt={contest.gameName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                          <Gamepad2 className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{contest.name}</h3>
                        <Badge status={contest.status} />
                      </div>
                      <p className="text-sm text-gray-400">{contest.gameName}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(contest.startDateTime)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg prize-glow">
                        {formatCurrency(contest.prizePool)}
                      </p>
                      <p className="text-xs text-gray-500">Prize Pool</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Games */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              Games
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {games.map((game, index) => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="group w-full"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="bg-dark-400 rounded-2xl p-4 flex flex-col items-center gap-3 border border-transparent group-hover:border-primary-500/30 transition-all duration-300 group-active:scale-95 shadow-lg shadow-black/20">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-dark-300 relative shadow-inner">
                    {game.image ? (
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                        <Gamepad2 className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-200 text-center truncate w-full group-hover:text-white transition-colors">
                    {game.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

