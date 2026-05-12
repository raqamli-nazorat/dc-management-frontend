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

    const notificationTitle = payload?.notification?.title || "Yangi bildirishnoma";

    const notificationOptions = {
        body: payload?.notification?.body || "",
        icon: "/imgs/Logo.png",
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});