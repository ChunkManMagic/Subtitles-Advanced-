import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config from root directory
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function getCachedSubtitles(videoId: string) {
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
