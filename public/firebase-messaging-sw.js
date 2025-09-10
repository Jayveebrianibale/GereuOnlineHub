/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAm6oDvA83A08lt0TuGSqFsSx5ZbjeUK-I',
  authDomain: 'gereuonlinehub.firebaseapp.com',
  databaseURL: 'https://gereuonlinehub-default-rtdb.firebaseio.com',
  projectId: 'gereuonlinehub',
  storageBucket: 'gereuonlinehub.appspot.com',
  messagingSenderId: '985715415023',
  appId: '1:985715415023:web:3083ee60be6a64de81481a',
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification || {};
  if (title || body) {
    self.registration.showNotification(title || 'Notification', {
      body: body || '',
    });
  }
});


