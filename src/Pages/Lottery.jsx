import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Gift, Trophy, Calendar, Users, Ticket, AlertCircle } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Tabs from '../components/common/Tabs';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Lottery() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [joining, setJoining] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

  useEffect(() => {
    fetchLotteries();
  }, []);

  const fetchLotteries = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'lotteries'), orderBy('createdAt', 'desc')));
      setLotteries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching lotteries:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasJoined = (lottery) => {
    if (!currentUser || !lottery.participants) return false;
    return lottery.participants.some(p => p.odeuUserId === currentUser.uid);
  };

  const openJoinModal = (lottery) => {
    setSelectedLottery(lottery);
    setJoinModalOpen(true);
  };

  const handleJoin = async () => {
    if (!currentUser) {
      setJoinModalOpen(false);
      return;
    }

    const entryFee = selectedLottery.entryFee || 0;

    if (entryFee > 0 && userData.walletBalance < entryFee) {
      setErrorModal({
        open: true,
        message: 'Insufficient balance. Please add money to your wallet.'
      });
      return;
    }

    setJoining(true);
    try {
      // Create participant object
      const participant = {
        odeuId: crypto.randomUUID(),
        odeuUserId: currentUser.uid,
        odeuName: userData.displayName || 'Unknown',
        odeuEmail: userData.email || '',
        odeuJoinedAt: new Date().toISOString()
      };

      // Update lottery with participant
      await updateDoc(doc(db, 'lotteries', selectedLottery.id), {
        participants: arrayUnion(participant),
        participantCount: increment(1)
      });

      // Deduct entry fee if applicable
      if (entryFee > 0) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          walletBalance: increment(-entryFee),
          depositedBalance: increment(-entryFee)
        });

        // Create transaction
        await addDoc(collection(db, 'transactions'), {
          userId: currentUser.uid,
          userName: userData.displayName,
          userEmail: userData.email,
          type: 'entry_fee',
          amount: entryFee,
          description: `Lottery Entry - ${selectedLottery.title}`,
          status: 'completed',
          lotteryId: selectedLottery.id,
          createdAt: serverTimestamp()
        });

        await refreshUserData();
      }

      await fetchLotteries();
      setJoinModalOpen(false);
    } catch (error) {
      console.error('Error joining lottery:', error);
      setErrorModal({
        open: true,
        message: 'Failed to join lottery. Please try again.'
      });
    } finally {
      setJoining(false);
    }
  };

  const tabs = [
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'results', label: 'Results' }
  ];

  const filteredLotteries = activeTab === 'ongoing'
    ? lotteries.filter(l => l.status === 'upcoming' || l.status === 'ongoing')
    : lotteries.filter(l => l.status === 'finished');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-white mb-4">Lucky Draw</h1>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

        {filteredLotteries.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={activeTab === 'ongoing' ? 'No active lotteries' : 'No results yet'}
            description={activeTab === 'ongoing' ? 'Check back later for new lucky draws' : 'Results will appear here'}
          />
        ) : (
          <div className="space-y-4">
            {filteredLotteries.map((lottery) => (
              <Card key={lottery.id} className="overflow-hidden">
                {lottery.image && (
                  <div className="aspect-video -mx-4 -mt-4 mb-4">
                    <img src={lottery.image} alt={lottery.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-white">{lottery.title}</h3>
                  <Badge status={lottery.status} />
                </div>

                {lottery.description && (
                  <p className="text-sm text-gray-400 mb-3">{lottery.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-dark-400 rounded-lg">
                    <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-yellow-400">{formatCurrency(lottery.prizeAmount)}</p>
                    <p className="text-xs text-gray-500">Prize</p>
                  </div>
                  <div className="text-center p-2 bg-dark-400 rounded-lg">
                    <Ticket className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{formatCurrency(lottery.entryFee || 0)}</p>
                    <p className="text-xs text-gray-500">Entry Fee</p>
                  </div>
                  <div className="text-center p-2 bg-dark-400 rounded-lg">
                    <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{lottery.participantCount || 0}</p>
                    <p className="text-xs text-gray-500">Joined</p>
                  </div>
                </div>

                {lottery.status === 'finished' && lottery.winnerName && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 mb-3">
                    <p className="text-xs text-gray-400">Winner</p>
                    <p className="text-green-400 font-medium">{lottery.winnerName}</p>
                  </div>
                )}

                {lottery.status !== 'finished' && (
                  <div className="mt-3">
                    {!currentUser ? (
                      <Button fullWidth variant="secondary" onClick={() => window.location.href = '/login'}>
                        Login to Participate
                      </Button>
                    ) : hasJoined(lottery) ? (
                      <Button fullWidth variant="success" disabled>
                        <Ticket className="w-4 h-4 mr-2" /> Already Joined
                      </Button>
                    ) : (
                      <Button fullWidth onClick={() => openJoinModal(lottery)}>
                        <Ticket className="w-4 h-4 mr-2" />
                        Join - {lottery.entryFee > 0 ? formatCurrency(lottery.entryFee) : 'Free'}
                      </Button>
                    )}
                  </div>
                )}

                {lottery.finishedAt && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-200">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Draw Date: {formatDate(lottery.finishedAt)}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Join Confirmation Modal */}
      <Modal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Join Lucky Draw">
        {selectedLottery && (
          <div className="py-4">
            <div className="text-center mb-4">
              <Gift className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{selectedLottery.title}</h3>
              <p className="text-gray-400">Join this lucky draw for a chance to win!</p>
            </div>

            <div className="bg-dark-300 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Prize Amount</span>
                <span className="text-yellow-400 font-bold">{formatCurrency(selectedLottery.prizeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entry Fee</span>
                <span className="text-white font-semibold">
                  {selectedLottery.entryFee > 0 ? formatCurrency(selectedLottery.entryFee) : 'Free'}
                </span>
              </div>
              {selectedLottery.entryFee > 0 && (
                <div className="flex justify-between pt-2 border-t border-dark-200">
                  <span className="text-gray-400">Your Balance</span>
                  <span className={`font-semibold ${(userData?.walletBalance || 0) >= selectedLottery.entryFee ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(userData?.walletBalance || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Participants</span>
                <span className="text-blue-400 font-medium">{selectedLottery.participantCount || 0}</span>
              </div>
            </div>

            {selectedLottery.entryFee > 0 && (userData?.walletBalance || 0) < selectedLottery.entryFee ? (
              <Button fullWidth onClick={() => window.location.href = '/wallet/add'} variant="warning">
                Add Money to Wallet
              </Button>
            ) : (
              <Button fullWidth onClick={handleJoin} loading={joining}>
                Confirm & Join
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={errorModal.open} onClose={() => setErrorModal({ open: false, message: '' })} title="Error">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-300 mb-6">{errorModal.message}</p>
          <Button fullWidth onClick={() => setErrorModal({ open: false, message: '' })}>
            OK
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

