"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ref, get, getDatabase } from "@/config/FirebaseConfig";
import { app } from "@/config/FirebaseConfig";

// Design tokens
const DESIGN_TOKENS = {
  colors: {
    primary: "#004EF3",
    primaryHover: "#0040D0",
    background: "#EDEBFF",
    error: {
      background: "#FEE2E2",
      border: "#F87171",
      text: "#000000",
    },
  },
  spacing: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
  },
  borderRadius: {
    default: "0.5rem",
    lg: "0.75rem",
  },
};

// Component-specific constants
const TEXTS = {
  heading: "Enter Code to Join",
  subheading: "Play For Fun",
  placeholder: "Enter Invite Code",
  buttonText: "Join Game →",
  loadingText: "Checking...",
  errorTitle: "Code Not Found!",
  errorDefault:
    "An error occurred while checking the quiz code. Please try again.",
  errorInvalid: "Invalid quiz code. Please check and try again.",
};

// Extracted Error Alert Component
const ErrorAlert = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      role="alert"
    >
      <strong className="font-bold">{TEXTS.errorTitle} </strong>
      <span className="block sm:inline">{error}</span>
      <button
        className="absolute top-0 bottom-0 right-0 px-4 py-3"
        onClick={onClose}
        aria-label="Close error message"
      >
        <svg
          className="fill-current h-6 w-6 text-red-500"
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <title>Close</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
        </svg>
      </button>
    </div>
  );
};

const JoinGamePage = () => {
  // State management
  const [formState, setFormState] = useState({
    inviteCode: "",
    error: "",
    isLoading: false,
  });

  const router = useRouter();
  const database = getDatabase(app);

  // Event handlers
  const handleInputChange = (e) => {
    setFormState((prev) => ({
      ...prev,
      inviteCode: e.target.value,
      error: "",
    }));
  };

  const handleJoinGame = async () => {
    if (!formState.inviteCode) return;

    setFormState((prev) => ({ ...prev, isLoading: true, error: "" }));

    try {
      const quizCode = formState.inviteCode.toUpperCase();
      const isFreemiumQuiz = quizCode.startsWith("TBF");
      const isPremiumQuiz = quizCode.startsWith("TBP");

      if (!isFreemiumQuiz && !isPremiumQuiz) {
        setFormState((prev) => ({ ...prev, error: TEXTS.errorInvalid }));
        return;
      }

      const quizPath = isPremiumQuiz ? "paid_quizzes" : "quizzes";
      const quizRef = ref(database, `${quizPath}/${quizCode}`);
      const snapshot = await get(quizRef);

      if (snapshot.exists()) {
        sessionStorage.setItem("inviteCode", quizCode);
        localStorage.setItem("inviteCode", quizCode);
        router.push(isPremiumQuiz ? "./paid_set_username" : "./set_username");
      } else {
        setFormState((prev) => ({ ...prev, error: TEXTS.errorInvalid }));
      }
    } catch (error) {
      console.error("Error checking quiz code:", error);
      setFormState((prev) => ({ ...prev, error: TEXTS.errorDefault }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Back Button - Hidden on desktop */}
      <button
        onClick={() => router.back()}
        className="bg-white text-gray-600 h-14 flex items-center justify-start mb-1 w-full md:hidden shadow-sm"
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

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-grow px-4 md:px-0">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-[420px] mx-auto">
          <ErrorAlert
            error={formState.error}
            onClose={() => setFormState((prev) => ({ ...prev, error: "" }))}
          />

          {/* Cards Image Container */}
          <div
            className={`bg-[${DESIGN_TOKENS.colors.background}] rounded-t-lg p-4 mb-4 flex items-center justify-center`}
          >
            <div className="relative w-[150px] h-[39px]">
              <Image
                src="/icons/cards.png"
                alt="Cards Icon"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-4">
            <p className="text-black text-center text-sm md:text-base">
              {TEXTS.subheading}
            </p>

            <h2 className="text-xl md:text-2xl text-black font-semibold text-center">
              {TEXTS.heading}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder={TEXTS.placeholder}
                value={formState.inviteCode}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-200 p-3 rounded-md w-full 
                text-black focus:outline-none focus:ring-2 focus:ring-blue-500 
                focus:border-transparent placeholder:text-black"
              />

              <button
                className={`bg-[${DESIGN_TOKENS.colors.primary}] text-white font-bold py-3 px-4 
                rounded-md w-full transition duration-200 ease-in-out 
                hover:bg-[${DESIGN_TOKENS.colors.primaryHover}]
                active:transform active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleJoinGame}
                disabled={formState.isLoading || !formState.inviteCode}
              >
                {formState.isLoading ? TEXTS.loadingText : TEXTS.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePage;
