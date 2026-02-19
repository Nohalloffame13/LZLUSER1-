import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { compressImage } from '../utils/imageUtils';
import { ArrowLeft, QrCode, Upload, Info, CheckCircle } from 'lucide-react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/formatters';

export default function AddMoney() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    utr: '',
    screenshot: ''
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.7);
      setFormData({ ...formData, screenshot: compressed });
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.utr || !formData.screenshot) {
      alert('Please fill all fields and upload screenshot');
      return;
    }

    if (parseFloat(formData.amount) < (settings?.minDeposit || 100)) {
      alert(`Minimum deposit amount is ${formatCurrency(settings?.minDeposit || 100)}`);
      return;
    }

    setSubmitting(true);
    try {
      // Create deposit request
      const depositRef = await addDoc(collection(db, 'deposit_requests'), {
        userId: currentUser.uid,
        userName: userData.displayName,
        userEmail: userData.email,
        amount: parseFloat(formData.amount),
        utr: formData.utr,
        screenshot: formData.screenshot,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Create pending transaction for history
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        userName: userData.displayName,
        userEmail: userData.email,
        type: 'deposit',
        amount: parseFloat(formData.amount),
        description: `Deposit Request - UTR: ${formData.utr}`,
        status: 'pending',
        referenceId: depositRef.id,
        createdAt: serverTimestamp()
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request');
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
            Your deposit request has been submitted. It will be verified and credited within 24 hours.
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
          <h1 className="font-semibold text-white">Add Money</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* UPI QR Code */}
        <Card className="text-center">
          <h3 className="font-semibold text-white mb-3">Scan & Pay</h3>
          {settings?.upiQrImage ? (
            <div className="bg-white p-4 rounded-xl inline-block mb-3">
              <img src={settings.upiQrImage} alt="UPI QR" className="w-48 h-48 mx-auto" />
            </div>
          ) : (
            <div className="w-48 h-48 bg-dark-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-16 h-16 text-gray-600" />
            </div>
          )}
          {settings?.upiId && (
            <p className="text-primary-400 font-mono">{settings.upiId}</p>
          )}
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-500/10 border border-blue-500/30">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                <li>Scan the QR code or pay to UPI ID</li>
                <li>Minimum deposit: {formatCurrency(settings?.minDeposit || 100)}</li>
                <li>Enter your username in UPI remark</li>
                <li>Fill the form below after payment</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Amount Paid (₹)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder={`Minimum ${formatCurrency(settings?.minDeposit || 100)}`}
            required
          />

          <Input
            label="Transaction ID / UTR Number"
            value={formData.utr}
            onChange={(e) => setFormData({ ...formData, utr: e.target.value })}
            placeholder="Enter 12-digit UTR number"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {formData.screenshot ? (
              <div className="relative">
                <img
                  src={formData.screenshot}
                  alt="Screenshot"
                  className="w-full max-h-48 object-contain rounded-xl bg-dark-300"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, screenshot: '' })}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-dark-200 rounded-xl flex flex-col items-center gap-2 hover:border-primary-500 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-500" />
                <span className="text-gray-400">Upload Screenshot</span>
              </button>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Submit Deposit Request
          </Button>
        </form>
      </div>
    </Layout>
  );
}

