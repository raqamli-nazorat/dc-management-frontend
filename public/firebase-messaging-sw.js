importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyDQ5GG-k4e34soFdg7opiQvd_SeLDGWr4w",
    projectId: "raqamli-nazorat",
    messagingSenderId: "791372978385",
    appId: "1:791372978385:web:487c7c9e47354d54d40df0"
});

// Yangi versiya yuklanganda darhol faollashtirish
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Dublikatlarni ushlab qolish uchun kesh (8 soniya)
const recentNotifMap = new Map();

const getNotificationKey = (title, body) => {
    return `${(title || '').trim()}:::${(body || '').trim()}`;
};

// 1. ServiceWorkerRegistration.showNotification ni o'rab olamiz (Intercept)
// Bu Firebase SDK ning avtomatik chiqargan xabariga ham bizning "R" logoni qo'yadi va dublikatni to'xtatadi!
const origShowNotification = self.registration.showNotification;

self.registration.showNotification = function (title, options = {}) {
    const notifOptions = { ...options };

    // Har doim o'zimizning chiroyli logotipimizni qo'yamiz (Chrome "B" ko'rsatmasligi uchun)
    if (!notifOptions.icon || notifOptions.icon.includes('undefined')) {
        notifOptions.icon = '/imgs/Logo.png';
    }
    if (!notifOptions.badge) {
        notifOptions.badge = '/imgs/Logo.png';
    }

    const key = getNotificationKey(title, notifOptions.body);
    const now = Date.now();

    // Agar so'nggi 8 soniya ichida aynan shu bildirishnoma ko'rsatilgan bo'lsa - takroriy ko'rsatishni bekor qilamiz!
    if (recentNotifMap.has(key) && (now - recentNotifMap.get(key) < 8000)) {
        console.log("🚫 SW: Dublikat bildirishnoma bekor qilindi:", title);
        return Promise.resolve();
    }

    recentNotifMap.set(key, now);

    // Kesh hajmini nazorat qilish
    if (recentNotifMap.size > 50) {
        for (const [k, time] of recentNotifMap.entries()) {
            if (now - time > 30000) recentNotifMap.delete(k);
        }
    }

    // Tag bo'yicha ham brauzer darajasida birlashtirish
    if (!notifOptions.tag) {
        notifOptions.tag = `sw_${key.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}`;
    }

    return origShowNotification.call(self.registration, title, notifOptions);
};

const messaging = firebase.messaging();

// 2. Background xabarlarni tinglash
messaging.onBackgroundMessage((payload) => {
    console.log("BACKGROUND PAYLOAD:", payload);

    const data = payload?.data || {};
    const title = data.title || payload?.notification?.title || "Yangi bildirishnoma";
    const body = data.body || data.message || payload?.notification?.body || "";

    const key = getNotificationKey(title, body);
    const now = Date.now();

    // Agar bu xabar Firebase SDK tomonidan allaqachon avtomatik ko'rsatilgan bo'lsa (showNotification orqali o'tgan bo'lsa) - qayta ko'rsatmaymiz!
    if (recentNotifMap.has(key) && (now - recentNotifMap.get(key) < 8000)) {
        console.log("🚫 SW onBackgroundMessage: allaqachon ko'rsatilgan, qayta ko'rsatilmaydi");
        return;
    }

    const notificationOptions = {
        body: body,
        icon: "/imgs/Logo.png",
        badge: "/imgs/Logo.png",
        tag: data.id ? `notif_${data.id}` : `sw_${key.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}`,
        data: {
            url: data.url || "/"
        }
    };

    self.registration.showNotification(title, notificationOptions);
});

// 3. Bildirishnoma bosilganda sahifani ochish yoki fokus qilish
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                const targetUrl = event.notification?.data?.url || '/';
                return clients.openWindow(targetUrl);
            }
        })
    );
});