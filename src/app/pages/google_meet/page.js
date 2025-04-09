"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { client } from "../../client";
import { ConnectButton, darkTheme } from "thirdweb/react";
import { meet } from "@googleworkspace/meet-addons/meet.addons";

useEffect(() => {
  (async () => {
    const session = await meet.addon.createAddonSession({
      cloudProjectNumber: "23476738877",
    });
    await session.createMainStageClient();
  })();
}, []);

// 1. Memoize static components with React.memo
const GameCard = React.memo(({ title, reward, isPaid, onClick }) => (
  <div
    onClick={onClick}
    className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
  >
    <div className="p-6 bg-[#EDEBFF] flex items-center justify-center h-48">
      <Image
        src={isPaid ? "/icons/paid.png" : "/icons/free.png"}
        width={204}
        height={94}
        alt={title}
        className="object-contain"
      />
    </div>
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className="flex items-center mt-2">
        <span className="text-gray-700">Reward — </span>
        {isPaid ? (
          <div className="flex items-center ml-2">
            <span className="ml-1">$ {reward}</span>
          </div>
        ) : (
          <span className="ml-2">None</span>
        )}
      </div>
    </div>
  </div>
));

const ActionCard = React.memo(({ title, imageSrc, imageSize, href }) => (
  <Link href={href}>
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all h-full">
      <div className="bg-[#EDEBFF] rounded-xl p-6 flex items-center justify-center mb-4 h-48">
        <Image
          src={imageSrc}
          width={imageSize}
          height={imageSize}
          alt={title}
          className="object-contain"
        />
      </div>
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-xl font-bold text-gray-700">{title}</h3>
        <span className="text-xl text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="59"
            height="35"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h13M12 5l7 7-7 7" />
          </svg>
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
    <div className="bg-white rounded-xl p-4 shadow-sm h-full">
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <ul className="space-y-4 divide-y divide-gray-200">
          <li className="flex justify-between items-center pb-2">
            <span className="text-gray-600">Games Played</span>
            <span className="font-medium">0</span>
          </li>
          <li className="flex justify-between items-center py-2">
            <span className="text-gray-600">Points Earned</span>
            <div className="flex items-center">
              <Image
                src="/icons/free.s.png"
                width={20}
                height={20}
                alt="points"
              />
              <span className="ml-2 font-medium">{totalScore} pts</span>
            </div>
          </li>
          <li className="flex justify-between items-center pt-2">
            <span className="text-gray-600">Cash Earned</span>
            <div className="flex items-center">
              <Image
                src="/icons/paid.s.png"
                width={20}
                height={20}
                alt="cash"
              />
              <span className="ml-2 font-medium">$0</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="w-full mt-8 bg-transparent text-black font-medium py-3 px-4 rounded-lg transition-color">
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-start mt-14 mb-12">
          <h1 className="text-4xl font-medium ml-4 text-gray-900">
            Welcome,
            <br />
            <span className="font-semibold">Get your game on!</span>
          </h1>
        </div>
        <div className="grid grid-cols-1 text-gray-700 md:grid-cols-3 gap-5 mb-12">
          <ActionCard
            title="Host game"
            imageSrc="/icons/cards.png"
            imageSize={208}
            href="/pages/creategame"
          />
          <ActionCard
            title="Join game"
            imageSrc="/icons/input.png"
            imageSize={208}
            href="/pages/join_game"
          />
          <StatsCard />
        </div>
        <div className="flex space-x-8 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-4 font-medium ${
              activeTab === "templates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("myGames")}
            className={`pb-4 font-medium ${
              activeTab === "myGames"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Free games
          </button>
        </div>
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-gray-700 mb-6">
            {(showAll ? templates : templates.slice(0, 3)).map(
              (template, index) => (
                <GameCard
                  key={index}
                  title={template.title}
                  reward={template.reward}
                  isPaid={template.isPaid}
                  onClick={() => handleTemplateClick(template.code)}
                />
              )
            )}
          </div>
        )}
        {activeTab === "myGames" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold text-gray-700 mb-6">
            {(showAll ? visibleFreeGames : visibleFreeGames).map(
              (game, index) => (
                <GameCard
                  key={index}
                  title={game.title}
                  reward={game.reward}
                  isPaid={game.isPaid}
                  onClick={() => handleFreeGameClick(game.code)}
                />
              )
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-black font-medium hover:text-black transition-colors bg-white rounded-lg px-4 py-2 flex items-center gap-2"
          >
            {showAll ? "Show Less" : "View All"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
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
