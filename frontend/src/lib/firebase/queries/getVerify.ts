import { verifyCollection } from "@/firebaseConfig";
import { DocumentData, getDocs, query, where } from "firebase/firestore";

export async function getVerifyByUuid(uuid: string): Promise<DocumentData | null> {
  const q = query(verifyCollection, where("uuid", "==", uuid));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const verify = querySnapshot.docs[0].data();
  return verify;
}
