import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function Transactions() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
          orderBy('createdAt', 'desc')
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
          <h1 className="font-semibold text-white">Transaction History</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions"
            description="Your transaction history will appear here"
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const credit = isCredit(transaction.type);
              const Icon = credit ? ArrowDownLeft : ArrowUpRight;
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
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Pending</span>
                      )}
                      {isRejected && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">Rejected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{transaction.description}</p>
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
    </Layout>
  );
}

