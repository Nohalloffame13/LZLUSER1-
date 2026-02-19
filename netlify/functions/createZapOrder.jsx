exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const amount = body.amount;

    const res = await fetch("https://api.zapupi.com/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 947657f1d8649fbdd3ea4cc8ad3837e9"
      },
      body: JSON.stringify({
        amount: amount,
        currency: "INR",
        customer_mobile: "9999999999",
        redirect_url: "https://lzlautoadd.netlify.app/payment-success"
      })
    });

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_url: data.payment_url
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Zap API error" })
    };
  }
};
