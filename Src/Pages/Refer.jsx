import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Gift, Copy, Check, Share2, Users } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/formatters';

export default function Refer() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const referralCode = userData?.referralCode || 'N/A';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Last Zone Legends',
        text: `Join Last Zone Legends and get bonus! Use my referral code: ${referralCode}`,
        url: referralLink
      });
    } else {
      copyToClipboard(referralLink);
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
          <h1 className="font-semibold text-white">Refer & Earn</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 text-center py-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Refer Friends & Earn</h2>
          <p className="text-green-300 text-lg font-semibold">
            Get {formatCurrency(settings?.referralBonus || 50)} for each referral!
          </p>
        </Card>

        {/* Referral Code */}
        <Card>
          <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-200 rounded-xl px-4 py-3">
              <p className="text-xl font-bold text-primary-400 font-mono tracking-wider">{referralCode}</p>
            </div>
            <button
              onClick={() => copyToClipboard(referralCode)}
              className="p-3 bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
            >
              {copied ? <Check className="w-6 h-6 text-white" /> : <Copy className="w-6 h-6 text-white" />}
            </button>
          </div>
        </Card>

        {/* Share Button */}
        <Button fullWidth size="lg" icon={Share2} onClick={shareReferral}>
          Share with Friends
        </Button>

        {/* How it works */}
        <Card>
          <h3 className="font-semibold text-white mb-4">How it works</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Share your code</p>
                <p className="text-sm text-gray-400">Share your referral code with friends</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-medium">Friend signs up</p>
                <p className="text-sm text-gray-400">They register using your referral code</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-medium">Friend joins a match</p>
                <p className="text-sm text-gray-400">When they join their first paid match</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-bold">4</span>
              </div>
              <div>
                <p className="text-white font-medium">You get rewarded!</p>
                <p className="text-sm text-gray-400">{formatCurrency(settings?.referralBonus || 50)} bonus credited to your wallet</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

