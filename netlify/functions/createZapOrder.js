exports.handler = async (event) => {
      try {
            const body = JSON.parse(event.body);

                const amount = body.amount;

                    // dummy payment url (test ke liye)
                        const payment_url = `https://example.com/pay?amount=${amount}`;

                            return {
                                      statusCode: 200,
                                            body: JSON.stringify({
                                                        payment_url
                                            })
                            };

      } catch (err) {
            return {
                      statusCode: 500,
                            body: JSON.stringify({
                                        error: "Server error"
                            })
            };
      }
};