// react
import Image from "next/image";
import React from "react";

const HeroSignIn = () => {
  return (
    <section className="flex flex-col items-center justify-center max-md:h-[250px] h-full w-full relative py-6 px-6">
      <video autoPlay loop muted playsInline className="w-full h-full object-cover rounded-[32px]">
        <source src="/videos/hero-login.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute md:left-[48px] md:bottom-[48px] flex items-center justify-center gap-4">
        <Image
          src="/images/clpa-logo-white.svg"
          alt="logo"
          width={148}
          height={148}
          className="max-md:w-[72px] max-md:h-[72px]"
        />
        <p className="text-white text-[24px] md:text-[48px] font-bold font-beauford-bold leading-normal">
          El Peso
          <br />
          Digital
        </p>
      </div>
    </section>
  );
};

export default HeroSignIn;
