import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Wallet, Info, CheckCircle } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/formatters';

export default function Withdraw() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [formData, setFormData] = useState({
    amount: '',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    accountName: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'app_settings', 'main'));
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    const minWithdraw = settings?.minWithdrawal || 200;
    const winningBalance = userData?.winningBalance || 0;

    if (amount < minWithdraw) {
      alert(`Minimum withdrawal amount is ${formatCurrency(minWithdraw)}`);
      return;
    }

    if (amount > winningBalance) {
      alert('You can only withdraw from your winnings balance');
      return;
    }

    if (paymentMethod === 'upi' && !formData.upiId) {
      alert('Please enter UPI ID');
      return;
    }

    if (paymentMethod === 'bank' && (!formData.bankName || !formData.accountNumber || !formData.ifsc || !formData.accountName)) {
      alert('Please fill all bank details');
      return;
    }

    setSubmitting(true);
    try {
      const withdrawalData = {
        userId: currentUser.uid,
        userName: userData.displayName,
        userEmail: userData.email,
        amount: amount,
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      if (paymentMethod === 'upi') {
        withdrawalData.upiId = formData.upiId;
      } else {
        withdrawalData.bankDetails = {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
          accountName: formData.accountName
        };
      }

      // Create withdrawal request
      const withdrawalRef = await addDoc(collection(db, 'withdrawals'), withdrawalData);

      // Immediately deduct balance (will be returned if rejected)
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        walletBalance: increment(-amount),
        winningBalance: increment(-amount),
        updatedAt: serverTimestamp()
      });

      // Create pending transaction for history
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        userName: userData.displayName,
        userEmail: userData.email,
        type: 'withdrawal',
        amount: amount,
        description: `Withdrawal Request - ${paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}`,
        status: 'pending',
        referenceId: withdrawalRef.id,
        createdAt: serverTimestamp()
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      alert('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
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

  if (success) {
    return (
      <Layout hideNav>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-gray-400 text-center mb-6">
            Your withdrawal request has been submitted. It will be processed within 24-48 hours.
          </p>
          <Button onClick={() => navigate('/wallet')}>
            Back to Wallet
          </Button>
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
          <h1 className="font-semibold text-white">Withdraw</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Balance Card */}
        <Card className="bg-dark-400">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Withdrawable Balance</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(userData?.winningBalance || 0)}</p>
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p>Minimum withdrawal: {formatCurrency(settings?.minWithdrawal || 200)}</p>
              <p>Only winnings can be withdrawn</p>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 rounded-xl border-2 transition-colors ${paymentMethod === 'upi'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-200 bg-dark-300'
                }`}
            >
              <p className="font-medium text-white">UPI</p>
              <p className="text-xs text-gray-400">Instant transfer</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank')}
              className={`p-4 rounded-xl border-2 transition-colors ${paymentMethod === 'bank'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-200 bg-dark-300'
                }`}
            >
              <p className="font-medium text-white">Bank</p>
              <p className="text-xs text-gray-400">1-2 days</p>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder={`Minimum ${formatCurrency(settings?.minWithdrawal || 200)}`}
            required
          />

          {paymentMethod === 'upi' ? (
            <Input
              label="UPI ID"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              placeholder="yourname@upi"
              required
            />
          ) : (
            <>
              <Input
                label="Bank Name"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Enter bank name (e.g. SBI, HDFC)"
                required
              />
              <Input
                label="Account Number"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Enter account number"
                required
              />
              <Input
                label="IFSC Code"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                placeholder="Enter IFSC code"
                required
              />
              <Input
                label="Account Holder Name"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="Enter account holder name"
                required
              />
            </>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            disabled={(userData?.winningBalance || 0) < (settings?.minWithdrawal || 200)}
          >
            Submit Withdrawal Request
          </Button>
        </form>
      </div>
    </Layout>
  );
}

