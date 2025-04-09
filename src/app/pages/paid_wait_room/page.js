"use client";

import { useState, useEffect } from "react";
import { database, ref, onValue, update, set } from "@/config/FirebaseConfig";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const account = useActiveAccount();
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizCode, setQuizCode] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0); // Dynamic staked amount state

  useEffect(() => {
    if (!account?.address) return;

    const quizcodeRef = ref(database, `paid_quizcode/${account.address}`);

    const unsubscribeQuizCode = onValue(
      quizcodeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const dbQuizCode = snapshot.val().quizCode;
          const storedQuizCode = sessionStorage.getItem("inviteCode");
          if (dbQuizCode !== storedQuizCode) {
            sessionStorage.setItem("inviteCode", dbQuizCode);
            localStorage.setItem("inviteCode", dbQuizCode);
            setQuizCode(dbQuizCode);
          }
        }
      },
      (error) => {
        toast.error(`Failed to fetch quiz code: ${error.message}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    );

    return () => {
      unsubscribeQuizCode();
    };
  }, [account?.address]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedQuizCode = sessionStorage.getItem("inviteCode");
      setQuizCode(storedQuizCode);
    }
  }, []);

  useEffect(() => {
    if (!quizCode) return;

    const participantsRef = ref(
      database,
      `paid_quizzes/${quizCode}/participants`
    );
    const questionsRef = ref(database, `paid_quizzes/${quizCode}/questions`);
    const transactionDetailsRef = ref(
      database,
      `quiz_staking/${quizCode}/transactionDetails`
    );

    const unsubscribePlayers = onValue(
      participantsRef,
      (snapshot) => {
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
      },
      (error) => {
        toast.error(`Failed to fetch players: ${error.message}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    );

    const unsubscribeQuestions = onValue(
      questionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setQuestions(snapshot.val());
        } else {
          setQuestions([]);
        }
      },
      (error) => {
        toast.error(`Failed to fetch questions: ${error.message}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    );

    const unsubscribeTransactionDetails = onValue(
      transactionDetailsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const transactionDetails = snapshot.val();
          setStakedAmount(transactionDetails.amount);
        }
      },
      (error) => {
        toast.error(`Failed to fetch transaction details: ${error.message}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    );

    return () => {
      unsubscribePlayers();
      unsubscribeQuestions();
      unsubscribeTransactionDetails();
    };
  }, [quizCode]);

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(quizCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      toast.error(`Failed to copy PIN: ${err.message}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const startGame = () => {
    const numb = "0";
    const gameRef = ref(database, `paid_quizzes/${quizCode}`);
    const quizCheckerRef = ref(
      database,
      `paid_quizzes/${quizCode}/quiz_checker`
    );
    set(quizCheckerRef, true);
    update(gameRef, {
      game_start: true,
      current_question: numb,
    })
      .then(() => {
        router.push("./paid_host_game_mode");
      })
      .catch((error) => {
        toast.error(`Failed to start game: ${error.message}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-8">
          {/* Header Section - Vertical on mobile, Horizontal on desktop */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 md:mb-12 space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="flex items-center justify-center gap-3">
                <span className="text-gray-500 font-medium">PIN:</span>
                <span className="text-xl font-bold">{quizCode}</span>
                <button
                  onClick={copyPin}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    copySuccess
                      ? "bg-green-100 text-green-600"
                      : "hover:bg-gray-200"
                  }`}
                  title="Copy PIN"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="text-gray-500 font-medium">Rewards:</span>
                <div className="flex items-center">
                  <Image
                    src="/icons/paid.s.png"
                    alt="paid icon"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  <span className="text-xl font-bold text-blue-600">
                    ${stakedAmount}
                  </span>
                  {/* Dynamically display staked amount */}
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg"
            >
              Start Game
            </button>
          </div>

          {/* Content Section - Single Column on mobile, Two Columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Players Section */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image
                  src="/icons/people.s.png"
                  alt="players"
                  width={28}
                  height={28}
                />
                <h2 className="text-2xl font-bold">Players</h2>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
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
                  width={28}
                  height={28}
                />
                <h2 className="text-2xl font-bold">Questions</h2>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
                <ul className="space-y-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide">
                  {questions.map((question, index) => (
                    <li key={index} className="p-4 bg-white rounded-lg">
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <span className="text-blue-600 font-medium">
                            Q{index + 1}
                          </span>
                          <span className="text-gray-700 text-base">
                            {question.text}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-600">Answer:</span>
                          <span className="text-gray-400 min-h-[24px] bg-gray-50 px-3 py-1 rounded mt-1">
                            Hidden
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
