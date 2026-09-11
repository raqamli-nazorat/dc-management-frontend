importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyDQ5GG-k4e34soFdg7opiQvd_SeLDGWr4w",
    projectId: "raqamli-nazorat",
    messagingSenderId: "791372978385",
    appId: "1:791372978385:web:487c7c9e47354d54d40df0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("BACKGROUND PAYLOAD:", payload);

    // Agar payload'da notification mavjud bo'lsa, Firebase Web SDK uni avtomatik ko'rsatadi.
    // Qo'lda yana showNotification chaqirilsa 2 marta chiqadi.
    if (payload?.notification) {
        return;
    }

    const data = payload?.data || {};
    const notificationTitle = data.title || "Yangi bildirishnoma";

    const notificationOptions = {
        body: data.body || data.message || "",
        icon: "/imgs/Logo.png",
        tag: data.id ? `notif_${data.id}` : undefined,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});