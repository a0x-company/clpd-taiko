// next

// components
import Footer from "@/components/Footer";
import SignIn from "@/components/signin/SignIn";
import Navbar from "@/components/Navbar";
import HeroSignIn from "@/components/signin/Hero";

export default function SignInPage() {
  return (
    <main className="min-h-screen max-w-screen bg-white text-black flex flex-col">
      {/* <Navbar /> */}
      <SignIn />
      {/* <Footer /> */}
    </main>
  );
}
