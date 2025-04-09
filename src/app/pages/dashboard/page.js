"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { client } from "../../client";
import { ConnectButton, darkTheme } from "thirdweb/react";

// 1. Memoize static components with React.memo
const GameCard = React.memo(({ title, reward, isPaid, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="hidden md:flex flex-col bg-white rounded-xl p-1 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="relative  bg-[#EDEBFF] p-4 flex items-center justify-center h-32 md:h-48 rounded-xl overflow-hidden">
        {/* Image Container with rounded corners */}
        <Image
          src={isPaid ? "/icons/paid.png" : "/icons/free.png"}
          width={150}
          height={70}
          alt={title}
          className="object-contain"
        />
        <div className="absolute rounded-full bg-white top-2 right-2">
          <Image
            src="/arrowblue.svg"
            width={10}
            height={10}
            alt="arrow"
            className="md:w-7 w-7 h-7 md:h-7"
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-base md:text-lg font-semi-bold text-gray-900">
          {title}
        </h3>
        <div className="flex items-center mt-2">
          <span className="text-gray-700 text-sm md:text-base">Reward — </span>
          {isPaid ? (
            <div className="flex items-center ml-2">
              <span className="ml-1 text-sm md:text-base">$ {reward}</span>
            </div>
          ) : (
            <span className="ml-2 text-sm md:text-base">None</span>
          )}
        </div>
      </div>
    </div>
  );
});

const MobileGameCard = React.memo(({ title, reward, isPaid, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex md:hidden items-center bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden p-2 mb-2"
    >
      <Image
        src={isPaid ? "/icons/paid.png" : "/icons/free.png"}
        width={90}
        height={42}
        alt={title}
        className="object-contain rounded-md"
      />

      <div className="ml-3 flex-grow">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center mt-1">
          <span className="text-gray-700 text-xs">Reward — </span>
          {isPaid ? (
            <div className="flex items-center ml-1">
              <span className="text-xs">$ {reward}</span>
            </div>
          ) : (
            <span className="text-xs">None</span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <Image
          src="/arrowblue.svg"
          width={20}
          height={20}
          alt="arrow"
          className="w-5 h-5"
        />
      </div>
    </div>
  );
});

const ActionCard = React.memo(({ title, imageSrc, imageSize, href }) => (
  <Link href={href}>
    <div className="bg-white rounded-xl p-1.5 shadow-sm hover:shadow-md transition-all h-full flex-grow">
      <div className="bg-[#EDEBFF] rounded-xl p-6 flex items-center justify-center mb-2 h-24 md:h-40">
        {/* Reduced height */}
        <Image
          src={imageSrc}
          width={imageSize}
          height={imageSize}
          alt={title}
          className="object-contain"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm p-1 md:text-lg font-bold text-gray-700">
          {title}
        </h3>
        <span>
          <Image
            src="/arrow.svg"
            width={24}
            height={24}
            alt="arrow"
            className="md:w-8 md:h-22"
          />
        </span>
      </div>
    </div>
  </Link>
));

// 2. Optimize StatsCard with useMemo for expensive calculations
const StatsCard = React.memo(() => {
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const storedScore = localStorage.getItem("totalscore");
    setTotalScore(storedScore ? parseInt(storedScore, 10) : 0);
  }, []);

  return (
    <div className="bg-white rounded-xl p-3 ml-2 shadow-sm h-full">
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <ul className="space-y-2 divide-y divide-gray-200">
          <li className="flex justify-between items-center pb-1">
            <span className="text-gray-600 text-sm md:text-base">
              Games Played
            </span>
            <span className="font-medium text-sm md:text-base">0</span>
          </li>
          <li className="flex justify-between items-center py-1">
            <span className="text-gray-600 text-sm md:text-base">
              Points Earned
            </span>
            <div className="flex items-center">
              <Image
                src="/icons/free.s.png"
                width={16}
                height={16}
                alt="points"
              />
              <span className="ml-1 font-medium text-sm md:text-base">
                {totalScore} pts
              </span>
            </div>
          </li>
          <li className="flex justify-between items-center pt-1">
            <span className="text-gray-600 text-sm md:text-base">
              Cash Earned
            </span>
            <div className="flex items-center">
              <Image
                src="/icons/paid.s.png"
                width={16}
                height={16}
                alt="cash"
              />
              <span className="ml-1 font-medium text-sm md:text-base">$0</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="w-full mt-4 bg-transparent text-black font-medium py-2 px-3 rounded-lg transition-color">
        <div className="flex justify-center">
          <ConnectButton
            client={client}
            theme={darkTheme({
              colors: {
                connectedButtonBg: "hsl(0, 0%, 100%)",
                connectedButtonBgHover: "hsl(231, 32%, 86%)",
              },
            })}
          />
        </div>
      </div>
    </div>
  );
});

const HomePage = () => {
  // 4. Move static data outside component
  const [activeTab, setActiveTab] = useState("templates");
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  const handleTemplateClick = useCallback(
    (templateCode) => {
      sessionStorage.setItem("templateCode", templateCode);
      router.push("/pages/templates");
    },
    [router]
  );

  const handleFreeGameClick = useCallback(
    (gameCode) => {
      sessionStorage.setItem("gameCode", gameCode);
      router.push("/pages/free_games");
    },
    [router]
  );

  // 6. Memoize filtered games
  const visibleGames = useMemo(
    () => (showAll ? templates : templates.slice(0, 3)),
    [showAll]
  );

  const visibleFreeGames = useMemo(
    () => (showAll ? freeGames : freeGames.slice(0, 3)),
    [showAll]
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-start mt-24 mb-8">
          <h1 className="text-4xl font-medium ml-2 text-gray-900">
            Welcome,
            <br />
            <span className="font-semibold">Get your game on!</span>
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="col-span-2 grid grid-cols-2 gap-4 ">
            <ActionCard
              title="Host game"
              imageSrc="/icons/cards.png"
              imageSize={160} // Adjusted image size for mobile
              href="/pages/creategame"
            />
            <ActionCard
              title="Join game"
              imageSrc="/icons/input.png"
              imageSize={160} // Adjusted image size for mobile
              href="/pages/join_game"
            />
          </div>
          <StatsCard />
        </div>
        <div className="flex space-x-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-2 font-medium text-sm md:text-base ${
              activeTab === "templates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("myGames")}
            className={`pb-2 font-medium text-sm md:text-base ${
              activeTab === "myGames"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Free games
          </button>
        </div>
        {activeTab === "templates" && (
          <div className="mb-4">
            <div className="md:hidden">
              {visibleGames.map((template, index) => (
                <MobileGameCard
                  key={index}
                  title={template.title}
                  reward={template.reward}
                  isPaid={template.isPaid}
                  onClick={() => handleTemplateClick(template.code)}
                />
              ))}
            </div>
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-gray-700">
              {visibleGames.map((template, index) => (
                <GameCard
                  key={index}
                  title={template.title}
                  reward={template.reward}
                  isPaid={template.isPaid}
                  onClick={() => handleTemplateClick(template.code)}
                />
              ))}
            </div>
          </div>
        )}
        {activeTab === "myGames" && (
          <div className="mb-4">
            <div className="md:hidden">
              {visibleFreeGames.map((game, index) => (
                <MobileGameCard
                  key={index}
                  title={game.title}
                  reward={game.reward}
                  isPaid={game.isPaid}
                  onClick={() => handleFreeGameClick(game.code)}
                />
              ))}
            </div>
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-gray-700">
              {visibleFreeGames.map((game, index) => (
                <GameCard
                  key={index}
                  title={game.title}
                  reward={game.reward}
                  isPaid={game.isPaid}
                  onClick={() => handleFreeGameClick(game.code)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-black font-medium hover:text-black transition-colors bg-white rounded-lg px-3 py-1 flex items-center gap-1 text-sm md:text-base"
          >
            {showAll ? "Show Less" : "View All"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h13M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// 8. Move static data outside the component
const templates = [
  {
    title: "Buildathon Quiz",
    reward: "100",
    isPaid: true,
    code: "TEMPLATE_001",
  },
  { title: "Crypto Quiz", reward: "0", isPaid: false, code: "TEMPLATE_008" },
  { title: "Trivia Night", reward: "0", isPaid: false, code: "TEMPLATE_002" },
  {
    title: "Tech Trivia",
    reward: "100",
    isPaid: true,
    code: "TEMPLATE_003",
  },
  {
    title: "Brain Blitz",
    reward: "100",
    isPaid: true,
    code: "TEMPLATE_004",
  },
  {
    title: "Knowledge Knockout",
    reward: "100",
    isPaid: true,
    code: "TEMPLATE_005",
  },
  {
    title: "Pop Culture Clash",
    reward: "0",
    isPaid: false,
    code: "TEMPLATE_006",
  },
  {
    title: "Geography Trivia",
    reward: "100",
    isPaid: true,
    code: "TEMPLATE_007",
  },
  { title: "History Quiz", reward: "0", isPaid: false, code: "TEMPLATE_009" },
  {
    title: "Career Building Quiz",
    reward: "0",
    isPaid: false,
    code: "TEMPLATE_010",
  },
  {
    title: "AI quiz",
    reward: "0",
    isPaid: true,
    code: "TEMPLATE_011",
  },
  {
    title: "Films, Movies, and Anime Quiz",
    reward: "0",
    isPaid: false,
    code: "TEMPLATE_012",
  },
  {
    title: "General Web3 knowledge",
    reward: "0",
    isPaid: true,
    code: "TEMPLATE_013",
  },
  {
    title: "Music Quiz",
    reward: "0",
    isPaid: false,
    code: "TEMPLATE_014",
  },
  {
    title: "World Fact Quiz",
    reward: "0",
    isPaid: false,
    code: "TEMPLATE_015",
  },
];

const freeGames = [
  // Define your free game card data here
  {
    title: "Crypto Quiz",
    reward: "0",
    isPaid: false,
    code: "FREE_GAME_001",
  },
  {
    title: "Brain Blast",
    reward: "0",
    isPaid: false,
    code: "FREE_GAME_002",
  },
  {
    title: "Knowledge Knockout",
    reward: "0",
    isPaid: false,
    code: "FREE_GAME_003",
  },
];

export default React.memo(HomePage);
