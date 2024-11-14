// next
import { useRouter } from "next/router";

// components
import Signer from "@/components/signer-tx/Signer";

// utils
import axios from "axios";

const fetchVerify = async (slug: string) => {
  const res = await axios.get(`/api/auth/verify-tx?uuid=${slug}`);
  return res.data;
};

export default async function Verify() {
  const router = useRouter();
  const { slug } = router.query;

  let verify = null;
  let options = null;
  let phoneNumber = null;
  try {
    [verify] = await Promise.all([fetchVerify(slug as string)]);
    options = verify.options;
    phoneNumber = verify.phoneNumber;
  } catch (error) {
    console.error("Error al obtener los datos de verificación:", error);
  }

  return (
    <main className="min-h-screen min-w-screen bg-white text-black flex flex-col">
      <h1>Verify</h1>
      <Signer options={options} phoneNumber={phoneNumber} />
    </main>
  );
}
