const admin = require("firebase-admin");
const fetch = require("node-fetch");

if (!admin.apps.length) {
  admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN))
        });
        }

        const db = admin.firestore();

        exports.handler = async (event) => {
          try {
              const { amount, userId, mobile } = JSON.parse(event.body);

                  const settingsDoc = await db.collection("setting").doc("main").get();
                      const { minimumDeposit } = settingsDoc.data();

                          if (Number(amount) < Number(minimumDeposit)) {
                                return {
                                        statusCode: 400,
                                                body: JSON.stringify({ error: "Minimum deposit not met" })
                                                      };
                                                          }

                                                              const orderId = "ORD_" + Date.now();

                                                                  const response = await fetch("https://api.zapupi.com/api/create-order", {
                                                                        method: "POST",
                                                                              headers: {
                                                                                      "Content-Type": "application/json",
                                                                                              "api-token": process.env.ZAP_API_TOKEN,
                                                                                                      "secret-key": process.env.ZAP_SECRET_KEY
                                                                                                            },
                                                                                                                  body: JSON.stringify({
                                                                                                                          order_id: orderId,
                                                                                                                                  amount: amount,
                                                                                                                                          custumer_mobile: mobile,
                                                                                                                                                  remark: "Wallet Deposit"
                                                                                                                                                        })
                                                                                                                                                            });

                                                                                                                                                                const data = await response.json();

                                                                                                                                                                    await db.collection("transactions").add({
                                                                                                                                                                          userId,
                                                                                                                                                                                amount,
                                                                                                                                                                                      orderId,
                                                                                                                                                                                            status: "pending",
                                                                                                                                                                                                  createdAt: admin.firestore.FieldValue.serverTimestamp()
                                                                                                                                                                                                      });

                                                                                                                                                                                                          return {
                                                                                                                                                                                                                statusCode: 200,
                                                                                                                                                                                                                      body: JSON.stringify(data)
                                                                                                                                                                                                                          };

                                                                                                                                                                                                                            } catch (error) {
                                                                                                                                                                                                                                return { statusCode: 500, body: "Order Error" };
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                  };