"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const THEME = {
  colors: {
    primary: "#004EF3",
    secondary: "#B8B8FE",
    text: {
      primary: "#29292B",
      secondary: "#4E4E4E",
    },
    background: "#F5F5F6",
  },
};

export default function CreateGame() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const inviteCode = localStorage.getItem("inviteCode");
    if (inviteCode) {
      const prefix = inviteCode.substring(0, 3);
      sessionStorage.setItem("inviteCode", inviteCode);

      if (prefix === "TBF") {
        router.push("./host_wait_room");
      } else if (prefix === "TBP") {
        router.push("./paid_wait_room");
      }
      // Invalid invite code is ignored
    }
  }, [router]);

  const GameModeCard = ({
    title,
    description,
    imageSrc,
    buttonColor,
    onClick,
  }) => (
    <div
      className="bg-white rounded-xl p-4 flex flex-col items-start shadow-lg cursor-pointer md:w-full"
      onClick={onClick}
    >
      <div className="rounded-xl mb-4 w-full aspect-video overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          width={800}
          height={800}
          className="object-cover"
        />
      </div>
      <h3 className="text-xl font-bold mb-1 text-gray-800 ml-0">{title}</h3>
      <div className="flex items-center justify-between w-full">
        <p className="text-gray-600 text-left  max-w-[70%]">{description}</p>
        <div
          className={`w-10 h-10 rounded-full ${
            title === "Play for rewards" ? "bg-[#004EF3]" : "bg-[#B8B8FE]"
          } flex items-center justify-center ml-auto`}
        >
          <Image
            src="/arrowwhite.svg"
            width={20}
            height={20}
            alt="arrow"
            className="w-6 h-6"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: THEME.colors.background }}
    >
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 mt-20">
        <div className="w-full max-w-3xl">
          <h1 className="font-medium  text-3xl leading-tight mb-2 text-[#29292B]">
            Get started,
          </h1>
          <h2 className="font-bold text-4xl leading-tight mb-8 text-[#29292B]">
            Select game mode
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GameModeCard
              title="Fun Mode"
              description="Set up your game, add players, and have fun"
              imageSrc="/icons/free.png"
              buttonColor={THEME.colors.secondary}
              onClick={() => router.push("./create_free_question")}
            />

            <GameModeCard
              title="Play for rewards"
              description="Set up your game, add players, and compete for prizes"
              imageSrc="/icons/paid.png"
              buttonColor={THEME.colors.primary}
              onClick={() => router.push("./create_paid_question")}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
