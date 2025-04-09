"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database, ref, set, get } from "@/config/FirebaseConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      600: "#000000",
      700: "#000000",
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
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const code = sessionStorage.getItem("inviteCode");
      setQuizCode(code);

      const existingUsername = sessionStorage.getItem(`username_${code}`);
      if (existingUsername) {
        router.push("./waiting_room");
        return;
      }

      if (code) {
        const gameRef = ref(database, `quizzes/${code}`);
        get(gameRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const gameData = snapshot.val();
              if (gameData.game_start) {
                setGameStarted(true);
                setError("This game has already started. You cannot join now.");
              }
            }
          })
          .catch((error) => {
            console.error("Error checking game status:", error);
          });
      }
    }
  }, [router]);

  const handleInputChange = (e) => {
    setSelectedName(e.target.value);
  };

  const handleBack = () => {
    router.back();
  };

  const saveParticipant = async (username) => {
    // Using a sanitized version of the username for the key
    const sanitizedUsername = username.replace(/\./g, "_");

    const paths = {
      gameParticipant: `game_participant/${quizCode}/${sanitizedUsername}`,
      leaderboard: `leaderboard/${sanitizedUsername}`,
      quizParticipant: `quizzes/${quizCode}/participants/${sanitizedUsername}`,
    };

    try {
      await Promise.all([
        set(ref(database, paths.gameParticipant), {
          score: 0,
          username: username,
        }), // Store the original username
        set(ref(database, paths.leaderboard), {
          quizplayed: 0,
          score: 0,
          username: username,
        }), // Store the original username
        set(ref(database, paths.quizParticipant), {
          score: 0,
          username: username,
        }), // Store the original username
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
      if (gameStarted) {
        setError("This game has already started. You cannot join now.");
        return;
      }
      if (selectedName.toLowerCase() === "clement") {
        toast.error("You can't use this name, please use another name", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      if (
        selectedName.length < USERNAME_CONSTRAINTS.MIN_LENGTH ||
        selectedName.length > USERNAME_CONSTRAINTS.MAX_LENGTH
      ) {
        setError(
          `Username must be between ${USERNAME_CONSTRAINTS.MIN_LENGTH} and ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters`
        );
        return;
      }

      await saveParticipant(selectedName);
      sessionStorage.setItem("username", selectedName);
      localStorage.setItem("username", selectedName);
      sessionStorage.setItem(`username_${quizCode}`, selectedName);
      router.push(`./waiting_room`);
    } catch (error) {
      setError("An error occurred while saving. Please try again.");
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

          {selectedName.toLowerCase() === "clement" && (
            <div className="mb-4">
              <p className="text-red-500 text-sm text-center" role="alert">
                You can't use this name, please use another name
              </p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-black text-center text-sm md:text-base">
              You&apos;ve been invited to play
            </p>

            <h1 className="text-xl text-black md:text-2xl font-semibold text-center">
              Buildathon Quiz
            </h1>

            <div className="space-y-3">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={`Enter preferred name (${USERNAME_CONSTRAINTS.MIN_LENGTH}-${USERNAME_CONSTRAINTS.MAX_LENGTH} characters)`}
                  value={selectedName}
                  onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-200 p-3 !text-black rounded-md w-full
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            placeholder:text-gray-500 text-sm md:text-base"
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default SetUsernamePage;
