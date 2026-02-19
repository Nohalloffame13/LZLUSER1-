import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, getMessagingInstance } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

// Helper function to detect iOS
const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export function usePushNotifications() {
    const lastNotificationRef = useRef(null);
    const initialLoadRef = useRef(true);
    const { showToast } = useToast();
    const { currentUser } = useAuth();
    const [fcmToken, setFcmToken] = useState(null);
    const [messagingSupported, setMessagingSupported] = useState(false);

    // 1. Listen for Firestore notifications (Primary method - works on ALL platforms including iOS)
    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1)),
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const notification = { id: change.doc.id, ...change.doc.data() };

                        // Skip the first load to avoid spamming old notifications
                        if (initialLoadRef.current) {
                            lastNotificationRef.current = notification.id;
                            initialLoadRef.current = false;
                            return;
                        }

                        // Check if this is a new notification
                        if (notification.id !== lastNotificationRef.current) {
                            // Show in-app toast for active users
                            showToast({
                                title: notification.title,
                                message: notification.message,
                                type: 'notification',
                                duration: 6000
                            });
                            lastNotificationRef.current = notification.id;
                        }
                    }
                });
            },
            (error) => {
                // Silently handle errors - don't crash the app
                console.warn('Notification listener error:', error);
            }
        );

        return () => unsubscribe();
    }, [showToast]);

    // 2. Initialize FCM Service Worker & Handle Foreground FCM Messages (Only for supported browsers - NOT iOS)
    useEffect(() => {
        const initFCM = async () => {
            // Skip FCM initialization on iOS - it's not supported
            if (isIOS()) {
                console.log('iOS detected - skipping FCM initialization, using Firestore notifications');
                return;
            }

            try {
                // Check if service worker is supported
                if (!('serviceWorker' in navigator)) {
                    console.log('Service Worker not supported');
                    return;
                }

                // Get messaging instance (will return null on unsupported browsers)
                const messaging = await getMessagingInstance();

                if (!messaging) {
                    console.log('Firebase Messaging not available on this browser');
                    return;
                }

                setMessagingSupported(true);

                // Register the service worker
                try {
                    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('Service Worker registered with scope:', registration.scope);
                } catch (swError) {
                    console.warn('Service Worker registration failed:', swError);
                    // Continue without SW - FCM may still work for foreground
                }

                // Handle foreground messages from FCM
                try {
                    const { onMessage } = await import('firebase/messaging');
                    onMessage(messaging, (payload) => {
                        console.log('[usePushNotifications] Foreground Message:', payload);
                        if (payload.notification) {
                            const { title, body } = payload.notification;
                            showToast({
                                title: title,
                                message: body,
                                type: 'notification',
                                duration: 6000
                            });
                        }
                    });
                } catch (msgError) {
                    console.warn('Failed to setup message listener:', msgError);
                }
            } catch (error) {
                console.error('Error initializing FCM:', error);
                // Don't crash the app - just log the error
            }
        };

        // Only init if window is available
        if (typeof window !== 'undefined') {
            initFCM();
        }
    }, [showToast]);

    // 3. Request Permission & Get Token (Only for supported browsers)
    const requestPermission = async () => {
        // iOS doesn't support Web Push Notifications
        if (isIOS()) {
            console.log('Push notifications not supported on iOS Safari');
            return 'unsupported';
        }

        if (!('Notification' in window)) {
            return 'unsupported';
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                await getAndSaveToken();
            }
            return permission;
        } catch (error) {
            console.error('Error requesting permission:', error);
            return 'denied';
        }
    };

    // Get FCM token and save to user profile
    const getAndSaveToken = async () => {
        // Skip on iOS
        if (isIOS()) return;

        try {
            const messaging = await getMessagingInstance();
            if (!messaging) return;

            const { getToken } = await import('firebase/messaging');

            // Get FCM Token
            const swRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            const token = await getToken(messaging, {
                serviceWorkerRegistration: swRegistration
            }).catch((err) => {
                console.warn('Failed to get FCM token:', err);
                return null;
            });

            if (token) {
                console.log('FCM Token obtained:', token.substring(0, 20) + '...');
                setFcmToken(token);

                // Save token to user profile if logged in
                if (currentUser) {
                    try {
                        const userRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userRef, {
                            fcmTokens: arrayUnion(token)
                        });
                        console.log('FCM Token saved to user profile');
                    } catch (saveError) {
                        console.warn('Failed to save FCM token:', saveError);
                    }
                }
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    };

    // Auto-get token if permission already granted (skip on iOS)
    useEffect(() => {
        if (isIOS()) return;

        if (currentUser && 'Notification' in window && Notification.permission === 'granted') {
            getAndSaveToken();
        }
    }, [currentUser]);

    // Get current permission status
    const getPermissionStatus = () => {
        if (typeof window === 'undefined') return 'unsupported';
        if (isIOS()) return 'unsupported';
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    };

    return {
        permission: getPermissionStatus(),
        requestPermission,
        fcmToken,
        isSupported: !isIOS() && messagingSupported
    };
}

