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
                    <h3 className="font-