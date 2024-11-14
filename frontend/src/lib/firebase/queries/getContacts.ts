import { redeemsCollection, userDataCollection } from "@/firebaseConfig";
import { DocumentData, getDocs, query, where } from "firebase/firestore";

export async function getContactsByPhoneNumber(phoneNumber: string): Promise<DocumentData | null> {
  const q = query(userDataCollection, where("phoneNumber", "==", phoneNumber));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const user = querySnapshot.docs[0].data();
  return user.contacts;
}
