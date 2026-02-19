// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyCdrH2241iaDDuo33lS7gEswhmwwiEDXWw",
    authDomain: "last-zone-91af9.firebaseapp.com",
      projectId: "last-zone-91af9",
        storageBucket: "last-zone-91af9.firebasestorage.app",
          messagingSenderId: "58463070590",
            appId: "1:58463070590:web:4b67aab1defe19cb176b2f"
            });

            // Retrieve an instance of Firebase Messaging so that it can handle background
            // messages.
            const messaging = firebase.messaging();

            messaging.onBackgroundMessage((payload) => {
              console.log('[firebase-messaging-sw.js] Received background message ', payload);
                // Customize notification here
                  const notificationTitle = payload.notification.title;
                    const notificationOptions = {
                        body: payload.notification.body,
                            icon: '/icons/icon-192x192.png'
                              };

                                self.registration.showNotification(notificationTitle, notificationOptions);
                                });
                                