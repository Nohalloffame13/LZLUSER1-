exports.handler = async (event) => {
  try {
    // ✅ SAFE PARSE (IMPORTANT FIX)
    let body = {};
    if (event.body) {
      body = JSON.parse(event.body);
    }

    const amount = body.amount;

    if (!amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Amount missing" })
      };
    }

    // 🔥 TEST RESPONSE
    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_url: `https://google.com`
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
