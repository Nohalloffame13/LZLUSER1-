import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Receipt, ChevronRight } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function Wallet() {
  const { currentUser, userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  const fetchTransactions = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
      );
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCredit = (type) => ['deposit', 'winning', 'bonus', 'manual_credit', 'refund'].includes(type);

  const getTypeIcon = (type) => {
    return isCredit(type) ? ArrowDownLeft : ArrowUpRight;
  };

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
      <div className="px-4 py-4 space-y-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary-600 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-sm">Total Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(userData?.walletBalance || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-white/70 text-xs">Deposited</p>
              <p className="font-semibold">{formatCurrency(userData?.depositedBalance || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs">Winnings</p>
              <p className="font-semibold">{formatCurrency(userData?.winningBalance || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-xs">Bonus</p>
              <p className="font-semibold">{formatCurrency(userData?.bonusBalance || 0)}</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/wallet/add">
            <Button fullWidth icon={Plus} size="lg">
              Add Money
            </Button>
          </Link>
          <Link to="/wallet/withdraw">
            <Button fullWidth variant="outline" icon={ArrowUpRight} size="lg">
              Withdraw
            </Button>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <Link to="/transactions" className="text-primary-400 text-sm flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <Card className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No transactions yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => {
                const Icon = getTypeIcon(transaction.type);
                const credit = isCredit(transaction.type);
                const isPending = transaction.status === 'pending';
                const isRejected = transaction.status === 'rejected';

                return (
                  <Card key={transaction.id} className={`flex items-center gap-3 bg-dark-400 ${isPending ? 'opacity-70' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRejected ? 'bg-gray-500/20' : credit ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                      <Icon className={`w-5 h-5 ${isRejected ? 'text-gray-400' : credit ? 'text-green-400' : 'text-red-400'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white capitalize">{transaction.type.replace('_', ' ')}</p>
                        {isPending && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">Pending</span>
                        )}
                        {isRejected && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Rejected</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDateTime(transaction.createdAt)}</p>
                    </div>
                    <p className={`font-semibold ${isRejected ? 'text-gray-400 line-through' : credit ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {credit ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

