export const handleZapPayment = async (amount, user) => {
    const response = await fetch("/.netlify/functions/createZapOrder", {
        method: "POST",
            headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                      amount,
                            userId: user.uid,
                                  mobile: user.phoneNumber || ""
                                      })
                                        });

                                          const data = await response.json();

                                            if (data.payment_url) {
                                                window.location.href = data.payment_url;
                                                  } else {
                                                      alert("Payment Error");
                                                        }
                                                        };
                                                        
}