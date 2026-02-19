import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, Users, Clock, Gamepad2 } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function MyContests() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'live', label: 'Live' },
        { value: 'finished', label: 'Finished' },
    ];

    useEffect(() => {
        fetchMyContests();
    }, [currentUser]);

    const fetchMyContests = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const snapshot = await getDocs(
                query(collection(db, 'tournaments'), orderBy('startDateTime', 'desc'))
            );

            const allTournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter to only tournaments user has participated in
            const myTournaments = allTournaments.filter(t =>
                t.participantDetails?.some(p => p.odeuUserId === currentUser.uid)
            );

            setTournaments(myTournaments);
        } catch (error) {
            console.error('Error fetching contests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTournaments = statusFilter === 'all'
        ? tournaments
        : tournaments.filter(t => t.status === statusFilter);

    const getStatusCount = (status) => {
        return tournaments.filter(t => t.status === status).length;
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

    if (!currentUser) {
        return (
            <Layout hideNav>
                <div className="sticky top-0 z-40 bg-dark-500 border-b border-dark-300">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-300 rounded-full">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <h1 className="font-semibold text-white">My Contests</h1>
                    </div>
                </div>
                <EmptyState
                    icon={Trophy}
                    title="Login Required"
                    description="Please login to view your contests"
                    action={
                        <Link to="/login" className="text-primary-400 hover:text-primary-300">
                            Login now →
                        </Link>
                    }
                />
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
                    <div>
                        <h1 className="font-semibold text-white">My Contests</h1>
                        <p className="text-xs text-gray-400">{tournaments.length} contests participated</p>
                    </div>
                </div>
            </div>

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
                                    {getStatusCount(option.value)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Empty State */}
                {filteredTournaments.length === 0 ? (
                    <EmptyState
                        icon={Trophy}
                        title={statusFilter === 'all' ? 'No contests yet' : `No ${statusFilter} contests`}
                        description={
                            statusFilter === 'all'
                                ? "You haven't joined any tournaments yet"
                                : `You don't have any ${statusFilter} tournaments`
                        }
                        action={
                            <Link to="/tournaments" className="text-primary-400 hover:text-primary-300">
                                Browse tournaments →
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-5">
                        {filteredTournaments.map((tournament) => (
                            <Link key={tournament.id} to={`/tournament/${tournament.id}`} className="block">
                                <Card className="flex gap-3 hover:border-primary-500/30 transition-all">
                                    {/* Game Image */}
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-200 flex-shrink-0 ring-2 ring-white/10">
                                        {tournament.gameImage ? (
                                            <img
                                                src={tournament.gameImage}
                                                alt={tournament.gameName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                                                <Gamepad2 className="w-8 h-8 text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Contest Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-white truncate">{tournament.name}</h3>
                                            <Badge status={tournament.status} />
                                        </div>

                                        <p className="text-sm text-gray-400">{tournament.gameName}</p>

                                        <div className="flex items-center gap-4 mt-1.5 text-xs">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDateTime(tournament.startDateTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Users className="w-3 h-3" />
                                                <span>{tournament.participantCount || 0}/{tournament.maxPlayers || '∞'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                                Entry: <span className="text-white">{formatCurrency(tournament.entryFee)}</span>
                                            </span>
                                            <span className="text-green-400 font-semibold text-sm">
                                                {formatCurrency(tournament.prizePool)}
                                            </span>
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

