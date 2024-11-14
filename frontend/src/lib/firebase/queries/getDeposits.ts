import { depositsCollection } from "@/firebaseConfig";
import { DocumentData, getDocs, query, where } from "firebase/firestore";

export async function getDepositsByPhoneNumber(phoneNumber: string): Promise<DocumentData | null> {
  const q = query(depositsCollection, where("phoneNumber", "==", phoneNumber));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const deposits = querySnapshot.docs.map((doc) => doc.data());
  return deposits;
}
