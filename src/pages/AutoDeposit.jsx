import { useState } from "react";

export default function AutoDeposit() {
  const [amount, setAmount] = useState("");

  const handlePayment = async () => {
    if (!amount || amount < 10) {
      alert("Minimum ₹10");
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/createZapOrder", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
      amount,
      userId: "test123"
      }),
      });
    }

      const data = await res.json();

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert("Payment failed");
      }

    } catch (err) {
      console.log(err);
      alert("Error");
    }
  };

  return (
    <div className="p-4 text-white">

      <h2 className="text-xl mb-4">Instant Deposit (Auto-Add)</h2>

      <input
        type="number"
        placeholder="Enter Amount (Min ₹10)"
        className="w-full p-3 rounded bg-gray-800 mb-4"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handlePayment}
        className="w-full bg-green-500 text-black p-3 rounded font-bold"
      >
        Proceed to Pay
      </button>

      <div className="mt-4 text-sm text-gray-300">
        <p>• You will be redirected to secure payment</p>
        <p>• Wait for payment page to load</p>
        <p>• After payment, wallet auto update</p>
        <p>• If not updated, contact support</p>
      </div>

    </div>
  );
}
