"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  database,
  ref,
  onValue,
  set,
  get,
  update,
  off,
} from "@/config/FirebaseConfig";
import { useRouter } from "next/navigation";
import { throttle, debounce } from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const QuizPage = React.memo(() => {
  const router = useRouter();
  const [gameState, setGameState] = useState({
    selectedAnswer: null,
    questionIndex: 0,
    questions: [],
    timeLeft: 15,
    score: 0,
    isSubmitted: false,
    isLoading: true,
    leaderboard: [],
  });

  const [sessionState, setSessionState] = useState({
    freeGameCode: null,
    username: null,
    isLoadingSession: true,
    isMobile: false,
  });

  const [feedback, setFeedback] = useState("");

  // Cache DOM selectors
  const leaderboardRef = useMemo(
    () => ref(database, "free_game/leaderboard"),
    []
  );

  // Add leaderboard listener effect - move this up with other effects
  useEffect(() => {
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      try {
        const data = snapshot.val() || {};
        const leaderboardArray = Object.entries(data)
          .map(([username, userData]) => ({
            username,
            score: userData.score || 0,
          }))
          .sort((a, b) => b.score - a.score);

        setGameState((prev) => ({
          ...prev,
          leaderboard: leaderboardArray,
        }));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        toast.error("Error fetching leaderboard. Please try again.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    });

    return () => unsubscribe();
  }, [leaderboardRef]);

  // Optimize username generation with single effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Handle mobile check
    const handleResize = throttle(() => {
      setSessionState((prev) => ({
        ...prev,
        isMobile: window.innerWidth < 768,
      }));
    }, 250);

    // Initialize username and game code
    const storedUsername =
      localStorage.getItem("freegameusername") ||
      `TRB${Math.floor(Math.random() * 1000000)}`;
    const gameCode = sessionStorage.getItem("gameCode");

    if (!localStorage.getItem("freegameusername")) {
      localStorage.setItem("freegameusername", storedUsername);
      sessionStorage.setItem("freegameusername", storedUsername);
    }

    setSessionState((prev) => ({
      ...prev,
      username: storedUsername,
      freeGameCode: gameCode,
      isLoadingSession: false,
      isMobile: window.innerWidth < 768,
    }));

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Optimize questions fetching with caching
  useEffect(() => {
    if (!sessionState.freeGameCode) return;

    const questionsRef = ref(
      database,
      `free_game/${sessionState.freeGameCode}/questions`
    );

    const unsubscribe = onValue(
      questionsRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const questionsArray = Object.values(data);
            setGameState((prev) => ({
              ...prev,
              questions: questionsArray,
              isLoading: false,
            }));
          } else {
            console.error("No questions found");
            setGameState((prev) => ({
              ...prev,
              isLoading: false,
            }));
            toast.error("No questions found for this game code.", {
              position: toast.POSITION.TOP_CENTER,
            });
          }
        } catch (error) {
          console.error("Error fetching questions:", error);
          setGameState((prev) => ({
            ...prev,
            isLoading: false,
          }));
          toast.error("Error fetching questions. Please try again.", {
            position: toast.POSITION.TOP_CENTER,
          });
        }
      },
      (error) => {
        console.error("Error fetching questions:", error);
        setGameState((prev) => ({
          ...prev,
          isLoading: false,
        }));
        toast.error("Error fetching questions. Please try again.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    );

    return () => unsubscribe();
  }, [sessionState.freeGameCode]);

  // Optimize timer with RAF instead of setInterval
  useEffect(() => {
    if (gameState.isLoading) return;

    let frameId;
    let lastTime = performance.now();
    const interval = 1000; // 1 second

    const updateTimer = (currentTime) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= interval) {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            handleNextQuestion();
            return { ...prev, timeLeft: 15 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
        lastTime = currentTime;
      }

      frameId = requestAnimationFrame(updateTimer);
    };

    frameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(frameId);
  }, [gameState.isLoading, gameState.questionIndex]);

  // Memoize current question
  const currentQuestion = useMemo(
    () => gameState.questions[gameState.questionIndex] || null,
    [gameState.questions, gameState.questionIndex]
  );

  // Memoize option buttons rendering
  const OptionButtons = useMemo(() => {
    if (!currentQuestion) return null;

    return currentQuestion.options.map((option, index) => (
      <button
        key={index}
        className={`bg-blue-500 hover:bg-blue-400 text-white p-4 md:p-6 rounded-xl flex items-center gap-4 transition-colors
          ${
            gameState.selectedAnswer === index
              ? "bg-blue-400 ring-2 ring-white"
              : ""
          }`}
        onClick={() => handleAnswerSelect(index)}
        disabled={gameState.isSubmitted}
      >
        <span className="text-lg md:text-xl font-medium">
          {String.fromCharCode(65 + index)}
        </span>
        <span className="text-base md:text-lg">{option}</span>
      </button>
    ));
  }, [currentQuestion, gameState.selectedAnswer, gameState.isSubmitted]);

  // Memoized handler functions
  const handleNextQuestion = useCallback(() => {
    setGameState((prev) => {
      const nextIndex = prev.questionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        router.push("./free_game_leaderboard");
        return prev;
      }
      return {
        ...prev,
        questionIndex: nextIndex,
        selectedAnswer: null,
        isSubmitted: false,
        timeLeft: 15,
      };
    });
  }, [router]);

  const handleAnswerSelect = useCallback((index) => {
    setGameState((prev) => ({
      ...prev,
      selectedAnswer: index,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (
      !currentQuestion ||
      gameState.isSubmitted ||
      gameState.selectedAnswer === null
    )
      return;

    const { username } = sessionState;
    if (!username) return;

    const isCorrect =
      gameState.selectedAnswer === currentQuestion.correctAnswer;
    const timeFactor = gameState.timeLeft / 20;
    const calculatedScore = Math.round(isCorrect ? 10 * timeFactor : 0);

    setFeedback(
      isCorrect
        ? "Correct! Well done!"
        : `Incorrect. The correct answer was: ${
            currentQuestion.options[currentQuestion.correctAnswer]
          }`
    );

    try {
      const scoreRef = ref(database, `free_game/leaderboard/${username}/score`);
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.val() || 0;
      const updatedScore = currentScore + calculatedScore;
      localStorage.setItem("totalscore", updatedScore);

      await update(ref(database, `free_game/leaderboard/${username}`), {
        score: updatedScore,
      });

      setGameState((prev) => ({
        ...prev,
        isSubmitted: true,
        score: prev.score + calculatedScore,
      }));

      setTimeout(async () => {
        if (gameState.questionIndex + 1 >= gameState.questions.length) {
          await markUserParticipation();
          router.push("./free_game_leaderboard");
        } else {
          handleNextQuestion();
        }
      }, 2000);
    } catch (error) {
      console.error("Error updating game state:", error);
      toast.error("Error updating game state. Please try again.", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, [
    currentQuestion,
    gameState,
    sessionState.username,
    handleNextQuestion,
    router,
  ]);

  const markUserParticipation = useCallback(async () => {
    const { username, freeGameCode } = sessionState;
    if (!username || !freeGameCode) return;

    try {
      const participationRef = ref(
        database,
        `free_game/participation/${freeGameCode}/${username}`
      );
      await set(participationRef, { hasParticipated: true });
    } catch (error) {
      console.error("Error marking participation:", error);
      toast.error("Error marking participation. Please try again.", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, [sessionState]);

  const checkUserParticipation = useCallback(async () => {
    const { username, freeGameCode } = sessionState;
    if (!username || !freeGameCode) return false;

    try {
      const participationRef = ref(
        database,
        `free_game/participation/${freeGameCode}/${username}`
      );
      const snapshot = await get(participationRef);
      return snapshot.exists() && snapshot.val()?.hasParticipated;
    } catch (error) {
      console.error("Error checking participation:", error);
      toast.error("Error checking participation. Please try again.", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }
  }, [sessionState]);

  useEffect(() => {
    const verifyParticipation = async () => {
      const { username, freeGameCode } = sessionState;
      if (!username || !freeGameCode) return;

      try {
        const hasParticipated = await checkUserParticipation();
        if (hasParticipated) {
          router.push("./free_game_leaderboard");
        } else {
          setSessionState((prev) => ({ ...prev, isLoadingSession: false }));
        }
      } catch (error) {
        console.error("Error verifying participation:", error);
        toast.error("Error verifying participation. Please try again.", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    };

    verifyParticipation();
  }, [
    sessionState.username,
    sessionState.freeGameCode,
    checkUserParticipation,
    router,
  ]);

  // Add debug logging
  useEffect(() => {
    console.log("Session State:", sessionState);
    console.log("Game State:", gameState);
  }, [sessionState, gameState]);

  // Add loading state check
  if (sessionState.isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-600">
          Initializing session...
        </div>
      </div>
    );
  }

  // Add game code check
  if (!sessionState.freeGameCode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-600">
          No game code found. Please start from the main page.
        </div>
      </div>
    );
  }

  // Modify the loading check to be more specific
  if (gameState.isLoading || gameState.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-600">
          Loading quiz questions...
        </div>
      </div>
    );
  }

  // Render logic remains mostly the same
  if (gameState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-600">
          Loading quiz...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-blue-100">
          <div className="flex flex-col md:flex-row">
            {/* Leaderboard Section - Only visible on desktop */}
            {!sessionState.isMobile && (
              <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-6">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h2 className="text-lg font-semibold">Leaderboard</h2>
                  </div>

                  {/* Scrollable Leaderboard List */}
                  <div
                    className="space-y-3 overflow-auto"
                    style={{
                      maxHeight: "250px",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <style>
                      {`
                        /* Hide scrollbar for Chrome, Safari, and Opera */
                        .space-y-3::-webkit-scrollbar {
                          display: none;
                        }
                        /* Hide scrollbar for IE, Edge, and Firefox */
                        .space-y-3 {
                          -ms-overflow-style: none; /* IE and Edge */
                          scrollbar-width: none; /* Firefox */
                        }
                      `}
                    </style>

                    {gameState.leaderboard.map((player, index) => (
                      <div
                        key={player.username}
                        className={`p-2 rounded ${
                          player.username === sessionState.username
                            ? "bg-blue-50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {index + 1}. {player.username}
                          </span>
                          <span className="text-blue-600 font-semibold">
                            {player.score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">
                      Time Remaining
                    </div>
                    <div className="text-4xl font-semibold text-blue-600">
                      {`00:${gameState.timeLeft.toString().padStart(2, "0")}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question Section */}
            <div className="flex-1 bg-blue-600 p-4 md:p-8">
              {currentQuestion && (
                <>
                  {/* Mobile Timer */}
                  {sessionState.isMobile && (
                    <div className="bg-white rounded-lg p-3 mb-4 text-center">
                      <div className="text-sm text-gray-500">
                        Time Remaining
                      </div>
                      <div className="text-2xl font-semibold text-blue-600">
                        {`00:${gameState.timeLeft.toString().padStart(2, "0")}`}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6 md:mb-12">
                    <span className="text-white text-base md:text-lg">
                      {`${gameState.questionIndex + 1} — ${
                        gameState.questions.length
                      }`}
                    </span>
                    <button
                      className={`bg-white text-blue-600 px-4 md:px-6 py-2 rounded-full font-medium text-sm md:text-base transition-colors
                      ${
                        gameState.isSubmitted ||
                        gameState.timeLeft === 0 ||
                        gameState.selectedAnswer === null
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-blue-50"
                      }`}
                      onClick={() => handleSubmit()}
                      disabled={
                        gameState.isSubmitted ||
                        gameState.timeLeft === 0 ||
                        gameState.selectedAnswer === null
                      }
                    >
                      Submit →
                    </button>
                  </div>

                  <div className="text-center mb-8 md:mb-16">
                    <h1 className="text-white text-xl md:text-3xl font-bold">
                      {currentQuestion.text}
                    </h1>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OptionButtons}
                  </div>
                  {/* Feedback message */}
                  {gameState.isSubmitted && (
                    <div className="mt-6 text-center text-lg font-semibold text-white bg-blue-700 p-3 rounded-lg">
                      {feedback}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

QuizPage.displayName = "QuizPage";
export default QuizPage;
