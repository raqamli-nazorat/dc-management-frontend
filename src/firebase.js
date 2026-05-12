import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { axiosAPI } from "./service/axiosAPI";

const firebaseConfig = {
    apiKey: "AIzaSyDQ5GG-k4e34soFdg7opiQvd_SeLDGWr4w",
    authDomain: "raqamli-nazorat.firebaseapp.com",
    projectId: "raqamli-nazorat",
    storageBucket: "raqamli-nazorat.firebasestorage.app",
    messagingSenderId: "791372978385",
    appId: "1:791372978385:web:487c7c9e47354d54d40df0",
    measurementId: "G-Y9LY88RWJJ",
};

export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

/**
 * Backendga tokenni yuborish
 */
const sendTokenToBackend = async (token) => {
    try {
        // Device ID ni barqaror qilish (har safar o'zgarmasligi uchun)
        let deviceId = localStorage.getItem('unique_device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}`;
            localStorage.setItem('unique_device_id', deviceId);
        }

        await axiosAPI.post("devices/register/", {
            fcm_token: token,
            device_type: "web",
            device_id: deviceId, // Barqaror ID
        });
        console.log("✅ Token backendga muvaffaqiyatli yuborildi");
    } catch (err) {
        console.error("❌ Token yuborishda backend xatosi:", err);
    }
};

/**
 * Tokenni olish va tekshirmasdan yuborish
 */
export const requestForToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn("⚠️ Notification ruxsati berilmadi");
            return null;
        }

        const currentToken = await getToken(messaging, {
            vapidKey: "BEJUVInA0TavhXQWeS7mCDuQWUVpnobSAr2OF2GQAYv8FfIB-X2fRcFQ9qxGhXNlRxCq91Ppssen2E3HQAR8_VM"
        });

        if (currentToken) {
            // Backendchi aytganidek: tekshirib o'tirmasdan har doim yuboramiz
            await sendTokenToBackend(currentToken);
            // LocalStorage faqat debug yoki boshqa maqsadlar uchun qolishi mumkin
            localStorage.setItem('fcm_token', currentToken);
            return currentToken;
        }
    } catch (err) {
        console.error("❌ Token olishda xato:", err);
    }
};

/**
 * Foreground xabarlarni tinglash
 */
export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("📨 Foreground xabar keldi:", payload);
            resolve(payload);
        });
    });