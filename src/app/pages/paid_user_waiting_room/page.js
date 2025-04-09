"use client";

import { useState, useEffect } from "react";
import { database, ref, onValue } from "@/config/FirebaseConfig";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const CONTAINER_STYLES = {
  wrapper: "min-h-screen bg-gray-100 pt-20",
  main: "container mx-auto max-w-4xl px-4 py-8",
  header: "bg-white rounded-2xl shadow-lg p-6 mb-6",
  quizInfo: "flex flex-col space-y-4",
  title: "text-2xl font-bold text-gray-900",
  subtitle: "text-gray-600 text-sm",
  infoGrid: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-6",
  infoCard: "bg-gray-50 rounded-xl p-4 flex items-center justify-between",
  infoLabel: "text-gray-600 flex items-center gap-2",
  infoValue: "font-semibold text-gray-900",
  playersSection: "bg-white rounded-2xl shadow-lg p-6 mt-6",
  loadingState: "flex justify-center items-center min-h-[200px]",
};

export default function WaitingRoom() {
  const router = useRouter();
  const [quizData, setQuizData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [quizCode, setQuizCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stakedAmount, setStakedAmount] = useState(0); // Dynamic staked amount state

  useEffect(() => {
    if (typeof window !== "undefined") {
      const inviteCode = localStorage.getItem("inviteCode");
      const username = localStorage.getItem("username");
      setQuizCode(inviteCode);
      sessionStorage.setItem("inviteCode", inviteCode);
      sessionStorage.setItem("username", username);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!quizCode) return;

    const quizRef = ref(database, `paid_quizzes/${quizCode}`);
    const unsubscribeQuiz = onValue(quizRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuizData(snapshot.val());
      }
    });

    const participantsRef = ref(
      database,
      `paid_quizzes/${quizCode}/participants`
    );
    const gameStartRef = ref(database, `paid_quizzes/${quizCode}/game_start`);
    const unsubscribePlayers = onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const playersArray = Object.entries(playersData).map(
          ([username, data]) => ({
            username,
            score: data.score,
            walletAdress: data.walletAddress,
          })
        );
        setPlayers(playersArray);
      } else {
        setPlayers([]);
      }
    });

    const unsubscribeGameStart = onValue(gameStartRef, (snapshot) => {
      console.log("Game start value:", snapshot.val());
      if (snapshot.exists() && snapshot.val() === true) {
        console.log("Redirecting to user game mode...");
        router.push("./paid_user_game_mode");
      }
    });

    // Dynamically fetch and update staked amount
    const transactionDetailsRef = ref(
      database,
      `quiz_staking/${quizCode}/transactionDetails`
    );
    const unsubscribeTransactionDetails = onValue(
      transactionDetailsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const transactionDetails = snapshot.val();
          setStakedAmount(transactionDetails.amount);
        }
      }
    );

    return () => {
      unsubscribeQuiz();
      unsubscribePlayers();
      unsubscribeGameStart();
      unsubscribeTransactionDetails();
    };
  }, [quizCode, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className={CONTAINER_STYLES.wrapper}>
      <main className={CONTAINER_STYLES.main}>
        <div className={CONTAINER_STYLES.header}>
          <div className={CONTAINER_STYLES.quizInfo}>
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-xl p-3">
                <Image
                  src="/icons/paid.png" // Add your quiz icon
                  alt="Quiz"
                  width={42}
                  height={42}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className={CONTAINER_STYLES.title}>
                  {quizData?.title || "Buidlathon Quiz"}
                </h1>
                <p className={CONTAINER_STYLES.subtitle}>
                  Waiting for host to start game
                </p>
              </div>
            </div>

            <div className={CONTAINER_STYLES.infoGrid}>
              <div className={CONTAINER_STYLES.infoCard}>
                <span className={CONTAINER_STYLES.infoLabel}>PIN</span>
                <div className="flex items-center gap-2">
                  <span className={CONTAINER_STYLES.infoValue}>{quizCode}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(quizCode);
                      toast.success("PIN copied to clipboard!");
                    }}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    title="Copy PIN"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={CONTAINER_STYLES.infoCard}>
                <span className={CONTAINER_STYLES.infoLabel}>Rewards</span>
                <span className={CONTAINER_STYLES.infoValue}>
                  ${stakedAmount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={CONTAINER_STYLES.playersSection}>
          <h2 className="text-lg text-black font-semibold mb-4">Players</h2>
          {players.length === 0 ? (
            <div className={CONTAINER_STYLES.loadingState}>
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600">Waiting for Players</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.username}
                  className="bg-gray-50 rounded-xl p-4 flex justify-between items-center"
                >
                  <span className="text-gray-900">{player.username}</span>
                  <span className="text-blue-600">P{index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}
