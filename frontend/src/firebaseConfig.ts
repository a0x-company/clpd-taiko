import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const userDataCollection = collection(db, "users");
const depositsCollection = collection(db, "deposits");
const redeemsCollection = collection(db, "burnRequests");
const bankListCollection = collection(db, "banks");
const verifyCollection = collection(db, "whatsappVerify");

export {
  db,
  userDataCollection,
  depositsCollection,
  redeemsCollection,
  bankListCollection,
  auth,
  verifyCollection,
};
