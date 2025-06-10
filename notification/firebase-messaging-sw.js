// firebase-messaging-sw.js
import * as dotenv from 'dotenv';

dotenv.config(); 
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: process.env.api_Key,
  authDomain: process.env.auth_Domain,
  projectId: process.env.project_Id,
  storageBucket: process.env.storage_Bucket,
  messagingSenderId: process.env.messaging_Sender_Id,
  appId: process.env.app_Id,
  measurementId: process.env.measurement_Id,
});

const messaging = firebase.messaging();
