const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN))
        });
        }

        const db = admin.firestore();

        exports.handler = async (event) => {
          try {
              const data = JSON.parse(event.body);

                  if (data.status === "Success") {

                        const transactionQuery = await db.collection("transactions")
                                .where("orderId", "==", data.order_id)
                                        .where("status", "==", "pending")
                                                .get();

                                                      if (!transactionQuery.empty) {

                                                              const transactionDoc = transactionQuery.docs[0];
                                                                      const transactionData = transactionDoc.data();
                                                                              const userRef = db.collection("users").doc(transactionData.userId);

                                                                                      await db.runTransaction(async (transaction) => {
                                                                                                const userDoc = await transaction.get(userRef);
                                                                                                          const currentWallet = userDoc.data().wallet || 0;

                                                                                                                    transaction.update(userRef, {
                                                                                                                                wallet: currentWallet + Number(data.amount)
                                                                                                                                          });

                                                                                                                                                    transaction.update(transactionDoc.ref, {
                                                                                                                                                                status: "success",
                                                                                                                                                                            paymentId: data.txn_id,
                                                                                                                                                                                        utr: data.utr
                                                                                                                                                                                                  });
                                                                                                                                                                                                          });
                                                                                                                                                                                                                }
                                                                                                                                                                                                                    }

                                                                                                                                                                                                                        return { statusCode: 200, body: "OK" };

                                                                                                                                                                                                                          } catch (error) {
                                                                                                                                                                                                                              return { statusCode: 500, body: "Webhook Error" };
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                };