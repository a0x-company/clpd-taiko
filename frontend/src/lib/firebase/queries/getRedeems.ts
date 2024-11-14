import { redeemsCollection } from "@/firebaseConfig";
import { DocumentData, getDocs, query, where } from "firebase/firestore";

export async function getRedeemsByPhoneNumber(phoneNumber: string): Promise<DocumentData | null> {
  const q = query(redeemsCollection, where("phoneNumber", "==", phoneNumber));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const redeems = querySnapshot.docs.map((doc) => doc.data());
  return redeems;
}
