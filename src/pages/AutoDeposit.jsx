import { useState } from "react";
import Layout from "../components/common/Layout";
import Button from "../components/common/Button";

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();
      console.log("API RESPONSE:", data);

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert("Payment failed");
      }

    } catch (err) {
      console.log(err);
      alert("Payment error");
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-4">

        <h2 className="text-xl text-white font-bold">
          Instant Deposit (Auto Add)
        </h2>

        <input
          type="number"
          placeholder="Enter Amount (Min ₹10)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 text-white"
        />

        <Button onClick={handlePayment} fullWidth>
          Proceed to Pay
        </Button>

        <div className="bg-gray-900 p-4 rounded text-sm text-gray-300">
          <p>• Secure payment page open hoga</p>
          <p>• Payment ke baad auto wallet add hoga</p>
          <p>• Delay ho toh thoda wait kare</p>
        </div>

      </div>
    </Layout>
  );
}
