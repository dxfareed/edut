"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { database, ref, onValue } from "@/config/FirebaseConfig";
import { Trophy, Medal, ChevronLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Leaderboard() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve username from session storage
    const username = localStorage.getItem("freegameusername");
    setCurrentUser(username);

    // Query the global leaderboard from the Firebase database
    const leaderboardRef = ref(database, `free_game/leaderboard`);

    const unsubscribeLeaderboard = onValue(
      leaderboardRef,
      (snapshot) => {
        if (snapshot.exists()) {
          try {
            const data = snapshot.val();
            const leaderboardArray = Object.entries(data).map(
              ([username, userData]) => ({
                name: username,
                score: userData.score,
              })
            );

            const sortedLeaderboard = leaderboardArray.sort(
              (a, b) => b.score - a.score
            );
            setLeaderboardData(sortedLeaderboard);
          } catch (error) {
            console.error("Error processing leaderboard data:", error);
            toast.error("Error loading leaderboard data.", {
              position: "top-center",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
            setLeaderboardData([]);
          }
        } else {
          setLeaderboardData([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching leaderboard data:", error);
        toast.error("Failed to fetch leaderboard. Please check your network.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setIsLoading(false);
        setLeaderboardData([]);
      }
    );

    return () => unsubscribeLeaderboard();
  }, []);

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
      <ToastContainer />
      {/* Navigation - Updated z-index and top positioning */}
      <div className="fixed top-[64px] left-0 right-0 bg-white shadow-md z-[999]">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <button
            onClick={() => router.push("./dashboard")}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 truncate max-w-xs md:max-w-full">
            Global Leaderboard
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
                  `}
                >
                  <div className="flex flex-col items-center">
                    <Trophy
                      className={`mb-2 ${
                        index === 0 ? "w-12 h-12" : "w-8 h-8"
                      }`}
                    />
                    <p className="text-sm md:text-base font-semibold truncate max-w-full">
                      {player.name}
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
                {leaderboardData.map((player, index) => {
                  const isCurrentUser = player.name === currentUser;
                  return (
                    <li
                      key={index}
                      className={`
                        flex justify-between items-center py-3 px-4 
                        ${index < 3 ? "bg-opacity-10" : ""}
                        ${isCurrentUser ? "bg-blue-100 font-semibold" : ""}
                        hover:bg-blue-50 transition-colors
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                        <span
                          className={`text-sm md:text-base 
                            ${isCurrentUser ? "text-blue-700" : ""}
                          `}
                        >
                          {player.name}
                          {isCurrentUser && " (You)"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium 
                          ${isCurrentUser ? "text-blue-700" : "text-blue-600"}
                        `}
                      >
                        {player.score} pts
                      </span>
                    </li>
                  );
                })}
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
