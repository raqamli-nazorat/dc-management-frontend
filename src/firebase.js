import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { axiosAPI } from "./service/axiosAPI";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

const sendTokenToBackend = async (token) => {
    try {
        await axiosAPI.post("devices/register/", {
            fcm_token: token,
            device_type: "web",
            device_id: navigator.userAgent.slice(0, 50),
        });
    } catch (err) {
        console.error("Token backendga yuborishda xato:", err);
    }
};

export const requestForToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn("Foydalanuvchi notification ruxsatini bermadi:", permission);
            return null;
        }
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        if (currentToken) {
            const savedToken = localStorage.getItem('fcm_token');
            if (savedToken !== currentToken) {
                // Token yangi yoki o'zgangan — backendga yuborish
                await sendTokenToBackend(currentToken);
                localStorage.setItem('fcm_token', currentToken);
                console.log('Yangi token saqlandi va backendga yuborildi');
            } else {
                console.log('Token o\'zgarmagan, qayta yuborilmadi');
            }
            return currentToken;
        }
    } catch (err) {
        console.error("Token olishda xato:", err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
