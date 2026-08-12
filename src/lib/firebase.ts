import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');

let firebaseConfig: any = null;
try {
  if (fs.existsSync(configPath)) {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (parsed.apiKey && parsed.apiKey !== 'YOUR_API_KEY_HERE') {
      firebaseConfig = parsed;
    }
  }
} catch (e) {
  console.warn('Could not load firebase-applet-config.json', e);
}

const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;

export async function getCachedSubtitles(videoId: string) {
  if (!db) return null;
  try {
    const docRef = doc(db, 'processed_videos', videoId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().subtitles;
    }
    return null;
  } catch (error) {
    console.error("Error fetching cached subtitles:", error);
    return null;
  }
}

export async function cacheSubtitles(videoId: string, subtitles: any[]) {
  if (!db) return;
  try {
    const docRef = doc(db, 'processed_videos', videoId);
    await setDoc(docRef, {
      videoId,
      subtitles,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error caching subtitles:", error);
  }
}
