"use client";
import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";

const cardData = [
  {
    title: "Fun Mode",
    description: "Play with friends and rang",
    image: "/icons/free.png",
  },
  {
    title: "Play For Crypto",
    description: "Earn rewards while playing",
    image: "/icons/pay.png",
  },
  {
    title: "Bond With Friends",
    description: "Connect and compete together",
    image: "/icons/web3.png",
  },
  {
    title: "Break Into Web3",
    description: "Learn about blockchain gaming",
    image: "/icons/basecoin.png",
  },
];

export default function Home() {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState(0);
  const benefitsSectionRef = useRef(null);

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) return; // Disable scroll effect for mobile view

      if (benefitsSectionRef.current) {
        const sectionTop = benefitsSectionRef.current.offsetTop;
        const sectionHeight = benefitsSectionRef.current.offsetHeight;
        const scrollPosition = window.scrollY;

        if (
          scrollPosition >= sectionTop - window.innerHeight / 2 &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          const newActiveCard = Math.floor(
            (scrollPosition - sectionTop + window.innerHeight / 2) /
              (sectionHeight / cardData.length)
          );
          setActiveCard(Math.min(newActiveCard, cardData.length - 1));
        } else {
          setActiveCard(0);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-white min-h-screen text-gray-800 font-sans">
      <Head>
        <title>TriviaBase - Interactive Q&A Platform</title>
        <meta
          name="description"
          content="TriviaBase is an interactive onchain Q&A platform for events and meetings. Enhance audience engagement with quizzes, polls, and games in real-time."
        />
      </Head>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 mt-[90px]">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            TriviaBase is where fun Games meet crypto rewards.
          </h1>
          <p className="text-md md:text-lg mb-6">
            A base for you and your community to play, earn and make memories.
          </p>
          <button
            className="bg-[#2643E9] text-white px-6 py-3 rounded-md font-semibold"
            onClick={() => router.push("./pages/dashboard")}
          >
            Play now →
          </button>
        </section>

        {/* Dashboard Section */}
        <section className="mb-0 flex justify-center items-center">
          <Image
            src="/icons/dashboard.png"
            alt="TriviaBase Dashboard"
            width={1200}
            height={600}
            className="rounded-md shadow-lg w-full"
          />
        </section>

        <section
          ref={benefitsSectionRef}
          className="bg-[#B8B8FE] py-16 rounded-lg px-8"
        >
          <div className="max-w-6xl mx-auto">
            {" "}
            {/* Adjusted max-width for wider layout */}
            <div className="text-white space-y-4 mb-8 ml-12">
              <h2
                className="text-xl font-semibold mb-6 inline-block text-white px-4 py-1 rounded-xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 100%)",
                }}
              >
                Benefits
              </h2>

              <p className="text-3xl font-medium">Play for fun</p>
              <p className="text-3xl font-medium">Play for crypto rewards</p>
              <p className="text-3xl font-medium">Bond with friends</p>
              <p className="text-3xl font-medium">Break into web3</p>

              <button
                className="bg-transparent text-white px-6 py-3 rounded-md font-semibold text-3xl"
                onClick={() => router.push("/pages/dashboard")}
              >
                Play Now →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 relative">
              {cardData.map((card, index) => (
                <div
                  key={index}
                  className={`bg-white p-8 rounded-xl shadow-lg transform transition duration-500 hover:scale-105 ${
                    index === activeCard ? "translate-y-[-2rem]" : ""
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <Image
                      src={card.image}
                      alt={card.title}
                      width={300}
                      height={400}
                      className="w-full h-auto mb-4"
                    />
                    <h2 className="text-xl font-semibold text-center mb-2">
                      {card.title}
                    </h2>
                    <p className="text-base text-gray-600 text-center">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
          <Link
            href="https://x.com/trivia_base"
            target="_blank"
            className="text-gray-800 font-medium text-lg md:text-2xl"
          >
            Follow us @trivia_base
          </Link>
          <Link
            href="https://x.com/base"
            target="_blank"
            className="text-gray-800 font-medium text-lg md:text-2xl mt-2 md:mt-0"
          >
            © Built with Love on Base
          </Link>
        </div>
      </footer>
    </div>
  );
}
