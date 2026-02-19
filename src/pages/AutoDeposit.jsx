import { useState } from "react";
import Layout from "../components/common/Layout";
import Button from "../components/common/Button";

export default function AutoDeposit()
{const [amount, setAmount] = useState(");
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
 
