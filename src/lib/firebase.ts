import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Replacement for process.env in Vite
const firebaseConfig = {
    apiKey: "AIzaSyDffXR2StA2Y785nWzkzqKuXTKP2jczEjc",
    authDomain: "keysmash-erdem-2025.firebaseapp.com",
    projectId: "keysmash-erdem-2025",
    storageBucket: "keysmash-erdem-2025.firebasestorage.app",
    messagingSenderId: "343330865138",
    appId: "1:343330865138:web:d153b4f0d677477e67f56b",
    // Standard format for new projects
    databaseURL: "https://keysmash-erdem-2025-default-rtdb.firebaseio.com"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
