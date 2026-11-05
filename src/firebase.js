// ============================================================================
// VibeTrader AI - Cloud Firestore Memory & Trading Journal Sync
// Provides real-time cloud synchronization for chat history, institutional analysis,
// and trading setups. Falls back gracefully to localStorage when offline.
// ============================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'school-2a76e',
  apiKey: 'AIzaSyB-0mv_Mw7naWG7NVKVCIJIeAyNbSobnlo',
  authDomain: 'school-2a76e.firebaseapp.com',
  storageBucket: 'school-2a76e.firebasestorage.app',
  messagingSenderId: '444688848760',
  appId: '1:444688848760:web:625383fd5900ffc262da8d',
  measurementId: 'G-2D67G0XW5E'
};

// Get active config from localStorage if user updated it, otherwise default
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem('vibe_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Could not read custom firebase config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

let app = null;
let db = null;

export function getFirebaseDb() {
  if (db) return db;
  try {
    const config = getFirebaseConfig();
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    return db;
  } catch (err) {
    console.warn('Firebase init error:', err.message);
    return null;
  }
}

// Subscribe to real-time chat updates from Firestore
export function subscribeToFirebaseChats(onChatsUpdated, onError = null) {
  const firestore = getFirebaseDb();
  if (!firestore) return () => {};

  try {
    const chatsCol = collection(firestore, 'vibe_chats');
    const q = query(chatsCol, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteChats = [];
        snapshot.forEach((docSnap) => {
          remoteChats.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        if (remoteChats.length > 0) {
          onChatsUpdated(remoteChats);
        }
      },
      (err) => {
        console.warn('Firestore real-time sync notice:', err.message);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscription failed:', err.message);
    return () => {};
  }
}

// Save a single chat document to Firestore
export async function syncChatToCloud(chat) {
  const firestore = getFirebaseDb();
  if (!firestore || !chat?.id) return false;

  try {
    const chatDocRef = doc(firestore, 'vibe_chats', String(chat.id));
    
    // Sanitize messages to avoid huge base64 blowing Firestore 1MB doc limit
    const sanitizedMessages = (chat.messages || []).map((m) => ({
      role: m.role || 'user',
      content: m.content || '',
      tradingMode: m.tradingMode || 'hedge_fund',
      image: m.image && m.image.length < 350000 ? m.image : null,
      timestamp: m.timestamp || Date.now()
    }));

    await setDoc(
      chatDocRef,
      {
        id: String(chat.id),
        title: chat.title || 'New Analysis',
        messages: sanitizedMessages,
        updatedAt: serverTimestamp(),
        lastActive: Date.now()
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Failed to sync chat to Firebase:', err.message);
    return false;
  }
}

// Delete chat document from Firestore
export async function removeChatFromCloud(chatId) {
  const firestore = getFirebaseDb();
  if (!firestore || !chatId) return false;

  try {
    const chatDocRef = doc(firestore, 'vibe_chats', String(chatId));
    await deleteDoc(chatDocRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete chat from Firebase:', err.message);
    return false;
  }
}

// Log a verified institutional trade setup to Trading Journal
export async function logTradeToCloudJournal(tradeData) {
  const firestore = getFirebaseDb();
  if (!firestore) return false;

  try {
    const journalId = `trade_${Date.now()}`;
    const journalDocRef = doc(firestore, 'vibe_trading_journal', journalId);
    await setDoc(journalDocRef, {
      ...tradeData,
      createdAt: serverTimestamp(),
      dateStr: new Date().toLocaleDateString('en-IN')
    });
    return true;
  } catch (err) {
    console.warn('Failed to save to cloud journal:', err.message);
    return false;
  }
}

// Sync AI Experience Memory & Learned Rules to Firestore Cloud
export async function syncTraderMemoryToCloud(memoryData) {
  const firestore = getFirebaseDb();
  if (!firestore || !memoryData) return false;

  try {
    const memoryDocRef = doc(firestore, 'vibe_trader_experience', 'global_memory');
    await setDoc(
      memoryDocRef,
      {
        xp: memoryData.xp || 0,
        level: memoryData.level || 1,
        levelTitle: memoryData.levelTitle || 'Level 1: Novice Quant Paper Trader',
        totalLessonsLearned: memoryData.totalLessonsLearned || 0,
        winStreak: memoryData.winStreak || 0,
        learnedRules: (memoryData.learnedRules || []).slice(0, 30),
        lastPostMortems: (memoryData.postMortemArchive || []).slice(0, 15),
        recentCoachHistory: (memoryData.coachHistory || []).slice(0, 10),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Failed to sync trader memory to Firebase:', err.message);
    return false;
  }
}

// Subscribe to real-time AI memory updates from Firestore
export function subscribeToTraderMemory(onMemoryUpdated) {
  const firestore = getFirebaseDb();
  if (!firestore) return () => {};

  try {
    const memoryDocRef = doc(firestore, 'vibe_trader_experience', 'global_memory');
    const unsubscribe = onSnapshot(memoryDocRef, (docSnap) => {
      if (docSnap.exists()) {
        onMemoryUpdated(docSnap.data());
      }
    }, (err) => {
      console.warn('Trader memory Firestore sync notice:', err.message);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to trader memory:', err.message);
    return () => {};
  }
}

