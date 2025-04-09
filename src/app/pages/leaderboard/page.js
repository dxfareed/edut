"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { database, ref, onValue } from "@/config/FirebaseConfig";
import { Trophy, Medal, ChevronLeft } from "lucide-react";

export default function Leaderboard() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [quizTitle, setQuizTitle] = useState("Quiz Title");
  const [isLoading, setIsLoading] = useState(true);
  const [quizCode, setQuizCode] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");

  useEffect(() => {
    const storedQuizCode = sessionStorage.getItem("inviteCode");
    const storedUsername = sessionStorage.getItem("username");
    console.log("Current username:", storedUsername);
    localStorage.removeItem("inviteCode");
    setQuizCode(storedQuizCode);
    setCurrentUsername(storedUsername || "");

    const quizRef = ref(database, `quizzes/${storedQuizCode}/title`);
    const unsubscribeQuizTitle = onValue(quizRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuizTitle(snapshot.val());
      }
    });

    return () => unsubscribeQuizTitle();
  }, []);

  useEffect(() => {
    if (quizCode) {
      const participantRef = ref(database, `game_participant/${quizCode}`);
      const unsubscribe = onValue(participantRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const participantsArray = Object.entries(data).map(
            ([user, info]) => ({
              name: user,
              score: info.score,
            })
          );
          sessionStorage.removeItem("currentQuestionIndex");

          const sortedParticipants = participantsArray.sort(
            (a, b) => b.score - a.score
          );
          setLeaderboardData(sortedParticipants);
        } else {
          setLeaderboardData([]);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [quizCode]);

  const pageVariants = {
    initial: { opacity: 0, x: "-100vw" },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: "100vw" },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  const getScoreColor = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 2:
        return "bg-gradient-to-r from-amber-600 to-amber-800 text-white";
      default:
        return "bg-white";
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen flex flex-col items-center justify-center overflow-hidden p-4"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {/* Navigation - Updated z-index and top positioning */}
      <div className="fixed top-[64px] left-0 right-0 bg-white shadow-md z-[999]">
        <div className="max-w-6xl mx-auto mt-4 flex items-center justify-between p-4">
          <button
            onClick={() => router.push("./dashboard")}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 truncate max-w-xs md:max-w-full">
            {quizTitle}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Updated top margin to account for both headers */}
      <div className="w-full max-w-4xl mt-36 md:mt-44 space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-500 animate-pulse">
            Loading Leaderboard...
          </div>
        ) : leaderboardData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Top 3 Winners Section */}
            <div className="bg-blue-50 p-6 text-center grid grid-cols-3 gap-4">
              {leaderboardData.slice(0, 3).map((player, index) => (
                <div
                  key={index}
                  className={`
                    rounded-xl p-4 transform transition-all duration-300 
                    ${index === 0 ? "scale-110" : "scale-100"}
                    ${getScoreColor(index)}
                    ${
                      player.name === currentUsername
                        ? "ring-4 ring-blue-500"
                        : ""
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <Trophy
                      className={`mb-2 ${
                        index === 0 ? "w-12 h-12" : "w-8 h-8"
                      }`}
                    />
                    <p
                      className={`text-sm md:text-base font-semibold truncate max-w-full
                        ${
                          player.name === currentUsername ? "text-blue-600" : ""
                        }
                      `}
                    >
                      {player.name}
                      {player.name === currentUsername && (
                        <span className="ml-1 text-xs text-blue-600">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-xs md:text-sm font-medium">
                      {player.score} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Full Leaderboard List */}
            <div className="p-4 text-black md:p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                <Medal className="mr-2 text-blue-600" />
                Full Leaderboard
              </h2>
              <ul className="divide-y divide-gray-200">
                {leaderboardData.map((player, index) => (
                  <li
                    key={index}
                    className={`
                      flex justify-between items-center py-3 px-4 
                      ${index < 3 ? "bg-opacity-10" : ""}
                      ${
                        player.name === currentUsername
                          ? "bg-blue-100 border-l-4 border-blue-500"
                          : ""
                      }
                      hover:bg-blue-50 transition-colors
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <span
                        className={`text-sm md:text-base font-semibold flex items-center
                        ${
                          player.name === currentUsername
                            ? "text-blue-600"
                            : "text-gray-800"
                        }`}
                      >
                        {player.name}
                        {player.name === currentUsername && (
                          <span className="ml-1 text-xs text-blue-600">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">
                      {player.score} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 bg-white p-8 rounded-2xl shadow-md">
            <Trophy className="mx-auto mb-4 text-gray-300" size={48} />
            <p>No participants found for this quiz.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
