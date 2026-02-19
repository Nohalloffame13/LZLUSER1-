import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, Users, Clock, Wallet, Copy, Check, Eye, EyeOff, Gamepad2, Award, Gift, Crosshair, AlertCircle, ChevronRight, User } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, refreshUserData } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [copied, setCopied] = useState({ roomId: false, password: false });
  const [activeTab, setActiveTab] = useState('details');
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

  // New slot selection states
  const [joinStep, setJoinStep] = useState(1); // 1 = position selection from grid, 2 = game ID entry
  const [selectedPositions, setSelectedPositions] = useState([]); // Array of { slot: number, position: 'A'|'B'|'C'|'D' }
  const [playerGameIds, setPlayerGameIds] = useState({}); // { "slot-position": "gameId" }

  // Match type configurations
  const matchTypeConfig = {
    solo: { size: 1, positions: ['A'] },
    duo: { size: 2, positions: ['A', 'B'] },
    squad: { size: 4, positions: ['A', 'B', 'C', 'D'] }
  };

  // Calculate slots info
  const matchType = tournament?.matchType || 'solo';
  const teamSize = matchTypeConfig[matchType]?.size || 1;
  const positions = matchTypeConfig[matchType]?.positions || ['A'];
  const totalSlots = tournament?.maxPlayers ? Math.ceil(tournament.maxPlayers / teamSize) : 100;

  // Get slot occupancy
  const slotOccupancy = useMemo(() => {
    if (!tournament?.participantDetails) return {};
    const occupancy = {};
    tournament.participantDetails.forEach(p => {
      if (p.slotNumber) {
        if (!occupancy[p.slotNumber]) occupancy[p.slotNumber] = {};
        occupancy[p.slotNumber][p.position] = p;
      }
    });
    return occupancy;
  }, [tournament?.participantDetails]);

  // Get teams for display
  const teams = useMemo(() => {
    if (!tournament?.participantDetails) return [];
    const teamMap = {};
    tournament.participantDetails.forEach(p => {
      const slotNum = p.slotNumber || 0;
      if (!teamMap[slotNum]) teamMap[slotNum] = { slotNumber: slotNum, members: [] };
      teamMap[slotNum].members.push(p);
    });
    return Object.values(teamMap).sort((a, b) => a.slotNumber - b.slotNumber);
  }, [tournament?.participantDetails]);

  // Check if slot is available
  const isSlotAvailable = (slotNum) => {
    const occupied = slotOccupancy[slotNum] || {};
    return Object.keys(occupied).length < teamSize;
  };

  // Get available positions in a slot
  const getAvailablePositions = (slotNum) => {
    const occupied = slotOccupancy[slotNum] || {};
    return positions.filter(pos => !occupied[pos]);
  };

  // User's slots
  const userSlots = useMemo(() => {
    if (!currentUser || !tournament?.participantDetails) return [];
    return tournament.participantDetails
      .filter(p => p.odeuUserId === currentUser.uid)
      .map(p => ({ slot: p.slotNumber, position: p.position }));
  }, [tournament?.participantDetails, currentUser]);

  const hasJoined = userSlots.length > 0;

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'tournaments', id));
      if (docSnap.exists()) {
        setTournament({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const openJoinModal = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setJoinStep(1);
    setSelectedPositions([]);
    setPlayerGameIds({});
    setJoinModalOpen(true);
  };

  // Max positions allowed based on match type
  const maxPositions = teamSize; // Solo=1, Duo=2, Squad=4

  // Toggle a position selection (can be from any slot)
  const togglePositionSelection = (slotNum, pos) => {
    const key = `${slotNum}-${pos}`;
    const existing = selectedPositions.find(p => p.slot === slotNum && p.position === pos);

    if (existing) {
      // Remove from selection
      setSelectedPositions(selectedPositions.filter(p => !(p.slot === slotNum && p.position === pos)));
      const newGameIds = { ...playerGameIds };
      delete newGameIds[key];
      setPlayerGameIds(newGameIds);
    } else {
      // Check if max positions reached
      if (selectedPositions.length >= maxPositions) {
        setErrorModal({
          open: true,
          message: `You can only select up to ${maxPositions} position${maxPositions > 1 ? 's' : ''} in a ${matchType.toUpperCase()} match.`
        });
        return;
      }
      // Add to selection
      setSelectedPositions([...selectedPositions, { slot: slotNum, position: pos }]);
      setPlayerGameIds({ ...playerGameIds, [key]: '' });
    }
  };

  // Check if a position is selected
  const isPositionSelected = (slotNum, pos) => {
    return selectedPositions.some(p => p.slot === slotNum && p.position === pos);
  };

  const goToStep2 = () => {
    if (selectedPositions.length === 0) {
      setErrorModal({ open: true, message: 'Please select at least one position.' });
      return;
    }
    setJoinStep(2);
  };

  const handleJoin = async () => {
    // Validate all game IDs for selected positions
    for (const sp of selectedPositions) {
      const key = `${sp.slot}-${sp.position}`;
      if (!playerGameIds[key]?.trim()) {
        setErrorModal({ open: true, message: `Please enter Game ID for Slot ${sp.slot} - Position ${sp.position}` });
        return;
      }
    }

    // Check for duplicate game IDs in tournament
    for (const sp of selectedPositions) {
      const key = `${sp.slot}-${sp.position}`;
      const gameIdExists = tournament.participantDetails?.some(
        p => p.odeuGameId?.toLowerCase() === playerGameIds[key].trim().toLowerCase()
      );
      if (gameIdExists) {
        setErrorModal({
          open: true,
          message: `Game ID "${playerGameIds[key]}" is already registered in this tournament.`
        });
        return;
      }
    }

    // Calculate total cost based on selected positions
    const totalCost = tournament.entryFee * selectedPositions.length;

    if (userData.walletBalance < totalCost) {
      setErrorModal({
        open: true,
        message: `Insufficient balance. You need ${formatCurrency(totalCost)} but have ${formatCurrency(userData.walletBalance)}`
      });
      return;
    }

    setJoining(true);
    try {
      // Create participant entries for each selected position
      const participants = selectedPositions.map(sp => {
        const key = `${sp.slot}-${sp.position}`;
        return {
          odeuId: crypto.randomUUID(),
          odeuUserId: currentUser.uid,
          odeuName: userData.displayName || 'Unknown',
          odeuEmail: userData.email || '',
          odeuGameId: playerGameIds[key].trim(),
          slotNumber: sp.slot,
          position: sp.position,
          odeuJoinedAt: new Date().toISOString()
        };
      });

      // Update tournament with all participants
      for (const participant of participants) {
        await updateDoc(doc(db, 'tournaments', id), {
          participantDetails: arrayUnion(participant),
          participantCount: increment(1)
        });
      }

      // Deduct from wallet
      await updateDoc(doc(db, 'users', currentUser.uid), {
        walletBalance: increment(-totalCost),
        depositedBalance: increment(-totalCost),
        matchesPlayed: increment(1)
      });

      // Create transaction
      const slotsInfo = selectedPositions.map(sp => `${sp.slot}${sp.position}`).join(', ');
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        userName: userData.displayName,
        userEmail: userData.email,
        type: 'entry_fee',
        amount: totalCost,
        description: `Entry fee for ${tournament.name} - Positions: ${slotsInfo}`,
        status: 'completed',
        tournamentId: id,
        positions: selectedPositions,
        createdAt: serverTimestamp()
      });

      await refreshUserData();
      await fetchTournament();
      setJoinModalOpen(false);
      setJoinStep(1);
      setSelectedPositions([]);
      setPlayerGameIds({});
    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
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

  if (!tournament) {
    return (
      <Layout hideNav>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Trophy className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400">Tournament not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </Layout>
    );
  }

  // Calculate filled slots
  const filledSlots = Object.keys(slotOccupancy).filter(s => {
    const occupied = slotOccupancy[s];
    return Object.keys(occupied).length === teamSize;
  }).length;

  return (
    <Layout hideNav>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-dark-500 border-b border-dark-300">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-300 rounded-full">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-white truncate">{tournament.name}</h1>
            <p className="text-xs text-gray-400">{tournament.gameName}</p>
          </div>
          <Badge status={tournament.status} />
        </div>
      </div>

      <div className="pb-24">
        <div className="px-4 py-4 space-y-4">
          {/* Game Banner */}
          {tournament.gameImage && (
            <div className="relative h-40 rounded-2xl overflow-hidden">
              <img src={tournament.gameImage} alt={tournament.gameName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-500 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${matchType === 'squad' ? 'bg-purple-500' :
                    matchType === 'duo' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                    {matchType}
                  </span>
                  {tournament.map && (
                    <span className="px-2 py-1 bg-orange-500 rounded text-xs font-bold">
                      {tournament.map}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center bg-dark-400">
              <Wallet className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{formatCurrency(tournament.entryFee)}</p>
              <p className="text-xs text-gray-400">Per Player</p>
            </Card>
            <Card className="text-center bg-dark-400">
              <Trophy className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-400">{formatCurrency(tournament.prizePool)}</p>
              <p className="text-xs text-gray-400">Prize Pool</p>
            </Card>
            <Card className="text-center bg-dark-400">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{tournament.participantCount || 0}/{tournament.maxPlayers || '∞'}</p>
              <p className="text-xs text-gray-400">Total Players</p>
            </Card>
          </div>

          {/* Time */}
          <Card className="flex items-center gap-3 bg-dark-400">
            <Clock className="w-5 h-5 text-primary-400" />
            <div>
              <p className="text-sm text-gray-400">Starts at</p>
              <p className="text-white font-medium">{formatDateTime(tournament.startDateTime)}</p>
            </div>
          </Card>

          {/* Tab Navigation */}
          <div className="flex bg-dark-400 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'details'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'participants'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Teams
            </button>
            <button
              onClick={() => setActiveTab('prizes')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'prizes'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Prizes
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4 animate-fade-in">
                {/* Room Details */}
                {hasJoined && tournament.showRoomDetails && (tournament.roomId || tournament.roomPassword) && (
                  <Card className="bg-dark-400">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">Room Details</h3>
                      <button onClick={() => setShowRoomDetails(!showRoomDetails)} className="p-2 hover:bg-dark-300 rounded-lg">
                        {showRoomDetails ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    {showRoomDetails ? (
                      <div className="space-y-3">
                        {tournament.roomId && (
                          <div className="flex items-center justify-between p-3 bg-dark-300 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-400">Room ID</p>
                              <p className="text-white font-mono">{tournament.roomId}</p>
                            </div>
                            <button onClick={() => copyToClipboard(tournament.roomId, 'roomId')} className="p-2 hover:bg-dark-200 rounded-lg">
                              {copied.roomId ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                            </button>
                          </div>
                        )}
                        {tournament.roomPassword && (
                          <div className="flex items-center justify-between p-3 bg-dark-300 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-400">Password</p>
                              <p className="text-white font-mono">{tournament.roomPassword}</p>
                            </div>
                            <button onClick={() => copyToClipboard(tournament.roomPassword, 'password')} className="p-2 hover:bg-dark-200 rounded-lg">
                              {copied.password ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Tap the eye icon to reveal room details</p>
                    )}
                  </Card>
                )}

                {/* Your Slots */}
                {userSlots.length > 0 && (
                  <Card className="bg-green-500/10 border border-green-500/30">
                    <h3 className="font-semibold text-green-400 mb-2">Your Bookings</h3>
                    <div className="flex flex-wrap gap-2">
                      {userSlots.map((slot, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Slot {slot.slot} - {slot.position}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Map */}
                {tournament.map && (
                  <Card className="bg-dark-400">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Map</p>
                        <p className="text-white font-medium">{tournament.map}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Tags */}
                {tournament.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tournament.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-dark-300 rounded-full text-xs text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {tournament.description && (
                  <Card className="bg-dark-400">
                    <h3 className="font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-400 text-sm whitespace-pre-line">{tournament.description}</p>
                  </Card>
                )}

                {/* Rules */}
                {tournament.rules && (
                  <Card className="bg-dark-400">
                    <h3 className="font-semibold text-white mb-2">Rules</h3>
                    <p className="text-gray-400 text-sm whitespace-pre-line">{tournament.rules}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Participants/Teams Tab */}
            {activeTab === 'participants' && (
              <div className="space-y-3 animate-fade-in">
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">{matchType === 'solo' ? 'No players yet' : 'No teams yet'}</p>
                    <p className="text-sm text-gray-500">Be the first to join!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-3">
                      {matchType === 'solo'
                        ? `${tournament?.participantCount || 0} player${(tournament?.participantCount || 0) !== 1 ? 's' : ''} registered`
                        : `${teams.length} team${teams.length > 1 ? 's' : ''} registered`
                      }
                    </p>
                    {teams.map((team) => (
                      <Card key={team.slotNumber} className="bg-dark-400">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-primary-400">
                            {matchType === 'solo' ? `#${team.slotNumber}` : `Slot #${team.slotNumber}`}
                          </span>
                          {matchType !== 'solo' && (
                            <span className="text-xs text-gray-500">
                              {team.members.length}/{teamSize} players
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {team.members.sort((a, b) => (a.position || 'Z').localeCompare(b.position || 'Z')).map((member) => (
                            <div key={member.odeuId} className="flex items-center gap-3 p-2 bg-dark-300 rounded-lg">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.position === 'A' ? 'bg-yellow-500/20 text-yellow-400' :
                                member.position === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                  member.position === 'C' ? 'bg-green-500/20 text-green-400' :
                                    member.position === 'D' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-gray-500/20 text-gray-400'
                                }`}>
                                {matchType === 'solo' ? team.slotNumber : (member.position || '-')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{member.odeuName}</p>
                                <p className="text-xs text-gray-500 truncate">{member.odeuGameId}</p>
                              </div>
                              {member.odeuUserId === currentUser?.uid && (
                                <span className="text-xs text-green-400 px-2 py-0.5 bg-green-500/20 rounded">You</span>
                              )}
                            </div>
                          ))}
                          {/* Empty positions - only for Duo/Squad */}
                          {matchType !== 'solo' && positions.filter(pos => !team.members.find(m => m.position === pos)).map(pos => (
                            <div key={pos} className="flex items-center gap-3 p-2 bg-dark-300/50 rounded-lg border border-dashed border-dark-200">
                              <div className="w-8 h-8 rounded-full bg-dark-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                {pos}
                              </div>
                              <p className="text-gray-500 text-sm">Position Available</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Prizes Tab */}
            {activeTab === 'prizes' && (
              <div className="space-y-4 animate-fade-in">
                {/* Prize Distribution */}
                <Card className="bg-dark-400">
                  <h3 className="font-semibold text-white mb-4">Prize Distribution</h3>
                  <div className="space-y-3">
                    {tournament.prize1 > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg">
                        <div className="w-10 h-10 bg-yellow-500/30 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-yellow-400 font-semibold">1st Place</p>
                        </div>
                        <p className="text-yellow-400 font-bold">{formatCurrency(tournament.prize1)}</p>
                      </div>
                    )}
                    {tournament.prize2 > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-400/20 to-transparent rounded-lg">
                        <div className="w-10 h-10 bg-gray-400/30 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-300 font-semibold">2nd Place</p>
                        </div>
                        <p className="text-gray-300 font-bold">{formatCurrency(tournament.prize2)}</p>
                      </div>
                    )}
                    {tournament.prize3 > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/20 to-transparent rounded-lg">
                        <div className="w-10 h-10 bg-orange-500/30 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-orange-400 font-semibold">3rd Place</p>
                        </div>
                        <p className="text-orange-400 font-bold">{formatCurrency(tournament.prize3)}</p>
                      </div>
                    )}
                    {tournament.perKillPrize > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/20 to-transparent rounded-lg">
                        <div className="w-10 h-10 bg-red-500/30 rounded-full flex items-center justify-center">
                          <Crosshair className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-red-400 font-semibold">Per Kill</p>
                        </div>
                        <p className="text-red-400 font-bold">{formatCurrency(tournament.perKillPrize)}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div >

      {/* Fixed Bottom Button */}
      {
        tournament.status !== 'finished' && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-500 border-t border-dark-300 safe-bottom">
            {hasJoined ? (
              <Button fullWidth size="lg" disabled variant="secondary">
                Already Joined ✓
              </Button>
            ) : (tournament.participantCount || 0) >= (tournament.maxPlayers || Infinity) ? (
              <Button fullWidth size="lg" disabled variant="secondary">
                Tournament Full ({tournament.participantCount || 0}/{tournament.maxPlayers || '∞'} Players)
              </Button>
            ) : (
              <Button fullWidth size="lg" onClick={openJoinModal}>
                Join Tournament - {formatCurrency(tournament.entryFee)}/player
              </Button>
            )}
          </div>
        )
      }

      {/* Join Modal - Step 1: Position Selection from Grid */}
      <Modal
        isOpen={joinModalOpen && joinStep === 1}
        onClose={() => setJoinModalOpen(false)}
        title="Select Your Positions"
        size="lg"
      >
        <div className="py-2">
          {/* Info */}
          <div className="mb-4 p-3 bg-primary-500/10 rounded-lg">
            <p className="text-sm text-primary-400">
              <span className="font-bold">{matchType.toUpperCase()}</span> Tournament
              <span className="text-xs text-gray-400 ml-2">(Max {maxPositions} position{maxPositions > 1 ? 's' : ''})</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Click on empty positions to select. Entry Fee: <span className="text-white font-bold">{formatCurrency(tournament.entryFee)}</span> per position
            </p>
          </div>

          {/* Position Selection Grid */}
          <div className="bg-dark-400 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid gap-2 p-3 bg-dark-300 text-sm font-medium" style={{ gridTemplateColumns: `60px repeat(${teamSize}, 1fr)` }}>
              <div className="text-gray-400">Slot</div>
              {positions.map(pos => (
                <div key={pos} className={`text-center font-bold ${pos === 'A' ? 'text-yellow-400' :
                  pos === 'B' ? 'text-blue-400' :
                    pos === 'C' ? 'text-green-400' : 'text-purple-400'
                  }`}>{pos}</div>
              ))}
            </div>

            {/* Slots */}
            <div className="max-h-64 overflow-y-auto">
              {Array.from({ length: totalSlots }, (_, i) => i + 1).map(slotNum => {
                const occupied = slotOccupancy[slotNum] || {};
                const isFullSlot = Object.keys(occupied).length === teamSize;

                return (
                  <div
                    key={slotNum}
                    className={`grid gap-2 p-3 border-b border-dark-300 ${isFullSlot ? 'bg-red-500/5' : ''}`}
                    style={{ gridTemplateColumns: `60px repeat(${teamSize}, 1fr)` }}
                  >
                    <div className={`font-medium text-sm ${isFullSlot ? 'text-red-400' : 'text-white'}`}>
                      {slotNum}
                    </div>
                    {positions.map(pos => {
                      const player = occupied[pos];
                      const isSelected = isPositionSelected(slotNum, pos);

                      if (player) {
                        // Position is booked
                        return (
                          <div key={pos} className="flex justify-center">
                            <div className="w-7 h-7 bg-red-500/30 rounded flex items-center justify-center" title={`Booked: ${player.odeuGameId}`}>
                              <User className="w-4 h-4 text-red-400" />
                            </div>
                          </div>
                        );
                      } else {
                        // Position is available - make it clickable
                        return (
                          <div key={pos} className="flex justify-center">
                            <button
                              onClick={() => togglePositionSelection(slotNum, pos)}
                              className={`w-7 h-7 border-2 rounded flex items-center justify-center transition-all ${isSelected
                                ? 'border-green-500 bg-green-500/30'
                                : 'border-gray-600 hover:border-primary-500 hover:bg-primary-500/10'
                                }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-green-400" />}
                            </button>
                          </div>
                        );
                      }
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Positions Summary */}
          {selectedPositions.length > 0 && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Selected Positions</span>
                <span className="text-green-400 font-bold">{selectedPositions.length}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedPositions.sort((a, b) => a.slot - b.slot || a.position.localeCompare(b.position)).map(sp => (
                  <span key={`${sp.slot}-${sp.position}`} className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                    {sp.slot}{sp.position}
                  </span>
                ))}
              </div>
              <div className="flex justify-between border-t border-green-500/30 pt-2 mt-2">
                <span className="text-gray-400">Total Cost</span>
                <span className="text-green-400 font-bold text-lg">{formatCurrency(tournament.entryFee * selectedPositions.length)}</span>
              </div>
            </div>
          )}

          {/* Next Button */}
          <Button
            fullWidth
            size="lg"
            className="mt-4"
            onClick={goToStep2}
            disabled={selectedPositions.length === 0}
          >
            Next - Enter Game IDs ({selectedPositions.length}) <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Modal>

      {/* Join Modal - Step 2: Game ID Entry */}
      <Modal
        isOpen={joinModalOpen && joinStep === 2}
        onClose={() => setJoinModalOpen(false)}
        title="Enter Player Details"
      >
        <div className="py-2">
          {/* Back Button */}
          <button
            onClick={() => setJoinStep(1)}
            className="flex items-center gap-1 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to position selection
          </button>

          {/* Player Details Form */}
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {selectedPositions.sort((a, b) => a.slot - b.slot || a.position.localeCompare(b.position)).map((sp) => {
              const key = `${sp.slot}-${sp.position}`;
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${sp.position === 'A' ? 'bg-yellow-500/20 text-yellow-400' :
                      sp.position === 'B' ? 'bg-blue-500/20 text-blue-400' :
                        sp.position === 'C' ? 'bg-green-500/20 text-green-400' :
                          'bg-purple-500/20 text-purple-400'
                      }`}>Slot {sp.slot} - {sp.position}</span>
                    Game Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerGameIds[key] || ''}
                    onChange={(e) => setPlayerGameIds({ ...playerGameIds, [key]: e.target.value })}
                    placeholder={`Enter ${tournament.gameName || 'Game'} Username`}
                    className="w-full px-4 py-3 bg-dark-300 border border-dark-200 rounded-xl text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Note */}
          <p className="text-xs text-yellow-400/80 mt-3 px-1">
            ⚠️ Note: Make sure you enter your Game Username (IGN) and not Character ID.
          </p>
          {/* Payment Summary */}
          <div className="mt-6 p-4 bg-dark-300 rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Positions</span>
              <span className="text-white font-semibold">{selectedPositions.length}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Per Position</span>
              <span className="text-white">{formatCurrency(tournament.entryFee)}</span>
            </div>
            <div className="border-t border-dark-200 my-2 pt-2">
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-green-400 font-bold text-lg">
                  {formatCurrency(tournament.entryFee * selectedPositions.length)}
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-400">Your Balance</span>
              <span className={`font-semibold ${(userData?.walletBalance || 0) >= tournament.entryFee * selectedPositions.length
                ? 'text-green-400' : 'text-red-400'
                }`}>
                {formatCurrency(userData?.walletBalance || 0)}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          {(userData?.walletBalance || 0) < tournament.entryFee * selectedPositions.length ? (
            <Button fullWidth size="lg" className="mt-4" onClick={() => navigate('/wallet/add')} variant="warning">
              Add Money to Wallet
            </Button>
          ) : (
            <Button fullWidth size="lg" className="mt-4" onClick={handleJoin} loading={joining}>
              Confirm & Pay {formatCurrency(tournament.entryFee * selectedPositions.length)}
            </Button>
        
