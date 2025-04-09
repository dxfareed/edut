"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database, ref, set, get } from "@/config/FirebaseConfig";
import { useActiveAccount } from "thirdweb/react";

//basename check

/* const account = useActiveAccount();
if (account) {
 const fetchAcountName = fetch(
  `https://fetch-api-mauve-iota.vercel.app/api/${account}`
)
.then((r) => {
 return r.json();
    })
    .then((data) => {
      return data;
    })
    .catch(() => {
      return "error";
    });
} */

// Constants
const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 25, // Increased max length to accommodate names with dots
};

const THEME = {
  colors: {
    primary: "#004EF3",
    primaryHover: "#0040D0",
    background: "#EDEBFF",
    white: "#FFFFFF",
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      400: "#9CA3AF",
      600: "#4B5563",
      700: "#374151",
    },
  },
  spacing: {
    base: "1rem",
    lg: "1.5rem",
  },
};

const SetUsernamePage = () => {
  const [selectedName, setSelectedName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [quizCode, setQuizCode] = useState(null);
  const activeAccount = useActiveAccount();

  // Add new state for wallet prompt
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = sessionStorage.getItem("inviteCode");
      setQuizCode(code);
    }
  }, []);

  useEffect(() => {
    if (!activeAccount?.address) {
      setShowWalletPrompt(true);
    } else {
      setShowWalletPrompt(false);
    }
  }, [activeAccount]);

  const handleInputChange = (e) => {
    setSelectedName(e.target.value);
  };

  const handleBack = () => {
    router.back();
  };

  const saveParticipant = async (username) => {
    if (!activeAccount?.address) {
      throw new Error("Wallet not connected");
    }

    // Check if game has already started
    const gameRef = ref(database, `paid_quizzes/${quizCode}`);
    const gameSnapshot = await get(gameRef);
    if (gameSnapshot.exists() && gameSnapshot.val().game_start) {
      throw new Error("Game has already started. You can no longer join.");
    }

    // Check for existing wallet in game participants
    const gameParticipantsRef = ref(database, `game_participant/${quizCode}`);
    const participantsSnapshot = await get(gameParticipantsRef);
    let existingParticipantKey = null;

    if (participantsSnapshot.exists()) {
      const participants = participantsSnapshot.val();
      for (const key in participants) {
        if (participants[key].walletAddress === activeAccount.address) {
          throw new Error("This wallet has already joined the game.");
        }
      }
    }

    // Check if username is taken in this game
    // Using a sanitized version of the username for the key
    const sanitizedUsername = username.replace(/\./g, "_");
    const usernameRef = ref(
      database,
      `game_participant/${quizCode}/${sanitizedUsername}`
    );
    const usernameSnapshot = await get(usernameRef);
    if (usernameSnapshot.exists()) {
      throw new Error("This username is already taken in this game");
    }

    const paths = {
      gameParticipant: `game_participant/${quizCode}/${sanitizedUsername}`,
      leaderboard: `leaderboard/${sanitizedUsername}`,
      quizParticipant: `paid_quizzes/${quizCode}/participants/${sanitizedUsername}`,
      userWallet: `users/${sanitizedUsername}`,
    };

    try {
      await Promise.all([
        set(ref(database, paths.gameParticipant), {
          score: 0,
          walletAddress: activeAccount.address,
          username: username, // Store the original username
        }),
        set(ref(database, paths.leaderboard), {
          quizplayed: 0,
          score: 0,
          walletAddress: activeAccount.address,
          username: username, // Store the original username
        }),
        set(ref(database, paths.quizParticipant), {
          score: 0,
          walletAddress: activeAccount.address,
          username: username, // Store the original username
        }),
        set(ref(database, paths.userWallet), {
          walletAddress: activeAccount.address,
          createdAt: new Date().toISOString(),
          username: username, // Store the original username
        }),
      ]);
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      throw error;
    }
  };

  const handleConfirm = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (!activeAccount?.address) {
        setError(
          "Please connect your wallet first. Click the 'Connect Wallet' button in the header to proceed."
        );
        setShowWalletPrompt(true);
        return;
      }

      if (
        selectedName.length < USERNAME_CONSTRAINTS.MIN_LENGTH ||
        selectedName.length > USERNAME_CONSTRAINTS.MAX_LENGTH
      ) {
        setError(
          `Username must be between ${USERNAME_CONSTRAINTS.MIN_LENGTH} and ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters. Current length: ${selectedName.length}`
        );
        return;
      }

      await saveParticipant(selectedName);
      sessionStorage.setItem("username", selectedName);
      localStorage.setItem("username", selectedName);
      router.push(`./paid_user_waiting_room`);
    } catch (error) {
      // More specific error handling based on error message
      if (error.message.includes("already has a username")) {
        setError(
          "This wallet is already registered with a username. Please use a different wallet or contact support if you think this is a mistake."
        );
      } else if (error.message.includes("already started")) {
        setError(
          "This game session has already begun and is not accepting new players. Please wait for the next game or contact the host."
        );
      } else if (error.message.includes("already joined the game")) {
        setError(
          "This wallet has already joined the game. Please use a different wallet or contact support if you think this is a mistake."
        );
      } else {
        setError(
          `Failed to join the game: ${error.message}. Please try again or contact support if the issue persists.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <button
        onClick={handleBack}
        className="bg-white text-gray-600 h-14 flex items-center justify-start w-full md:hidden shadow-sm"
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 ml-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>

      <main className="flex flex-col items-center justify-center flex-grow px-4 md:px-0">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-[420px] mx-auto">
          <div className="bg-[#EDEBFF] rounded-t-lg p-4 mb-4 flex items-center justify-center">
            <div className="relative w-[202px] h-[69px]">
              <Image
                src="/icons/100$ re.png"
                alt="Quiz Prize Banner"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="space-y-4">
            {showWalletPrompt ? (
              <div className="text-center space-y-3">
                <p className="text-gray-700">
                  Please connect your wallet to continue
                </p>
                <p className="text-sm text-gray-500">
                  Use the connect button in the header above
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-700 text-center text-sm md:text-base">
                  You&apos;ve been invited to play
                </p>

                <h1 className="text-xl md:text-2xl font-semibold text-center">
                  Buildathon Quiz
                </h1>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={`Enter preferred name (${USERNAME_CONSTRAINTS.MIN_LENGTH}-${USERNAME_CONSTRAINTS.MAX_LENGTH} characters)`}
                      value={selectedName}
                      onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-200 p-3 rounded-md w-full
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                placeholder:text-gray-400 text-sm md:text-base"
                      maxLength={USERNAME_CONSTRAINTS.MAX_LENGTH}
                      aria-label="Username input"
                      aria-invalid={!!error}
                      disabled={isLoading}
                    />
                    {error && (
                      <p className="text-red-500 text-sm" role="alert">
                        {error}
                      </p>
                    )}
                  </div>

                  <button
                    className="bg-[#004EF3] text-white font-bold py-3 px-4 rounded-md w-full
                              transition duration-200 ease-in-out hover:bg-[#0040D0]
                              active:transform active:scale-[0.98]
                              disabled:opacity-50 disabled:cursor-not-allowed
                              text-sm md:text-base"
                    onClick={handleConfirm}
                    disabled={isLoading || !selectedName}
                    aria-busy={isLoading}
                  >
                    {isLoading ? "Joining..." : "Join Game"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SetUsernamePage;
