"use client";

import { useState, useEffect } from "react";
import { database, ref, onValue, update, set } from "@/config/FirebaseConfig";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizCode, setQuizCode] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedQuizCode = sessionStorage.getItem("inviteCode");
      setQuizCode(storedQuizCode);
    }
  }, []);

  useEffect(() => {
    if (!quizCode) return;

    const participantsRef = ref(database, `quizzes/${quizCode}/participants`);
    const questionsRef = ref(database, `quizzes/${quizCode}/questions`);

    const unsubscribePlayers = onValue(participantsRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const playersArray = Object.entries(playersData).map(
          ([username, data]) => ({
            username,
            score: data.score,
          })
        );
        setPlayers(playersArray);
      } else {
        setPlayers([]);
      }
    });

    const unsubscribeQuestions = onValue(questionsRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuestions(snapshot.val());
      } else {
        setQuestions([]);
      }
    });

    return () => {
      unsubscribePlayers();
      unsubscribeQuestions();
    };
  }, [quizCode]);

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(quizCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy PIN:", err);
    }
  };

  const startGame = () => {
    const numb = "0";
    const gameRef = ref(database, `quizzes/${quizCode}`);
    const quizCheckerRef = ref(database, `quizzes/${quizCode}/quiz_checker`);
    set(quizCheckerRef, true);
    update(gameRef, {
      game_start: true,
      current_question: numb,
    })
      .then(() => {
        router.push("./host_game_mode");
      })
      .catch((error) => {
        console.error("Error starting game:", error);
      });
  };

  const handleDeleteGame = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteGame = async () => {
    try {
      sessionStorage.removeItem("inviteCode");
      localStorage.removeItem("inviteCode");
      router.push("/");
    } catch (error) {
      console.error("Error deleting game:", error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">PIN:</span>
                <span className="text-lg font-bold">{quizCode}</span>
              </div>
              <button
                onClick={copyPin}
                className={`ml-2 p-2 rounded-md transition-all duration-200 ${
                  copySuccess
                    ? "bg-green-100 text-green-600"
                    : "hover:bg-gray-200"
                }`}
                title="Copy PIN"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg">
              <span className="text-gray-500 font-medium">Rewards:</span>
              <div className="flex items-center">
                <Image
                  src="/icons/paid.s.png"
                  alt="paid icon"
                  width={20}
                  height={20}
                  className="mr-1"
                />
                <span className="text-lg font-bold text-blue-600">$0</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Start Game
            </button>
          </div>

          {/* Content Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Players Section */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image
                  src="/icons/people.s.png"
                  alt="players"
                  width={24}
                  height={24}
                />
                <h2 className="text-xl font-bold">Players</h2>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 min-h-[300px]">
                {players.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="flex space-x-2 mb-3">
                      <div className="bg-blue-600 w-2 h-2 rounded-full animate-bounce-first"></div>
                      <div className="bg-blue-600 w-2 h-2 rounded-full animate-bounce-second"></div>
                      <div className="bg-blue-600 w-2 h-2 rounded-full animate-bounce-third"></div>
                    </div>
                    <p className="text-gray-500">Waiting for players...</p>
                  </div>
                ) : (
                  <ul className="space-y-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                    {players.map((player, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {player.username}
                        </span>
                        <span className="text-blue-600 font-medium">
                          P{index + 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image
                  src="/icons/question.s.png"
                  alt="questions"
                  width={24}
                  height={24}
                />
                <h2 className="text-xl font-bold">Questions</h2>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 min-h-[300px]">
                <ul className="space-y-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                  {questions.map((question, index) => (
                    <li
                      key={index}
                      className="p-4 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-600 font-medium">
                              Q{index + 1}
                            </span>
                            <span className="text-gray-700">
                              {question.text}
                            </span>
                          </div>
                          <div className="text-gray-500 text-sm">
                            Answer: Hidden
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleDeleteGame}
          className="mt-4 w-full md:w-auto px-8 py-3 bg-white text-red-500 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
        >
          Delete Game
        </button>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h2 className="text-xl font-bold mb-4">Delete Game?</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this game? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteGame}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
