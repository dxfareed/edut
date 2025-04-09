"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  database,
  ref,
  update as firebaseUpdate,
  onValue,
} from "@/config/FirebaseConfig";
import { Trophy, Medal, ChevronLeft, Sparkles } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Leaderboard() {
  let boolTrns = false;
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [quizTitle, setQuizTitle] = useState("Quiz Title");
  const [isLoading, setIsLoading] = useState(true);
  const [quizCode, setQuizCode] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [contractAddress, setContractAddress] = useState(null);
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [topThreeWallets, setTopThreeWallets] = useState([]);
  const [transactionLink, setTransactionLink] = useState(null);
  let top_3_winners = [];
  useEffect(() => {
    const storedQuizCode = sessionStorage.getItem("inviteCode");
    localStorage.removeItem("inviteCode");
    setQuizCode(storedQuizCode);

    const quizRef = ref(database, `paid_quizzes/${storedQuizCode}/title`);
    const unsubscribeQuizTitle = onValue(quizRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuizTitle(snapshot.val());
      }
    });

    const storedUsername = sessionStorage.getItem("username");
    setCurrentUser(storedUsername);

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
              //@ts-ignore
              score: info.score,
              //@ts-ignore
              wallet: info.walletAddress,
            })
          );
          sessionStorage.removeItem("currentQuestionIndex");

          const sortedParticipants = participantsArray.sort(
            (a, b) => b.score - a.score
          );
          setLeaderboardData(sortedParticipants);

          // Extract top 3 winners' wallets
          const topThree = sortedParticipants
            .slice(0, 3)
            .map((participant) => participant.wallet);
          setTopThreeWallets(topThree);

          for (let i = 0; i < topThree.length; i++)
            top_3_winners.push(topThree[i]);
        } else {
          setLeaderboardData([]);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [quizCode, currentUser]);

  useEffect(() => {
    if (quizCode) {
      const transactionDetailsRef = ref(
        database,
        `quiz_staking/${quizCode}/transactionDetails`
      );
      const unsubscribeTransactionDetails = onValue(
        transactionDetailsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const quizcodeasync = async () => {
              const transactionDetails = snapshot.val();
              setContractAddress(transactionDetails.to);
              console.log(transactionDetails.to);

              const fetchArr = async (arrayAddress) => {
                try {
                  const response = await fetch(
                    process.env.NEXT_PUBLIC_CREATE_TRIVIA_REWARD,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ arrayAddress }),
                    }
                  );

                  if (!response.ok) {
                    console.error(`HTTP error! Status: ${response.status}`);
                    return "Transaction error";
                  }

                  const data = await response.json();
                  console.log("Response Data:", data.Transactionhash);
                  return data.Transactionhash;
                } catch (error) {
                  console.error("Error:", error);
                  throw error;
                }
              };

              try {
		let winners_contract =[];
		winners_contract[0]=transactionDetails.to + "";
		winners_contract.push(...top_3_winners.slice(0,3));
	       	const transHash = await fetchArr(winners_contract);

                if ( transHash !== "Transaction error" ) {
                  boolTrns = true;

                  console.log(
                    transHash,
                    "message for transaction hash, admin only"
                  );

                  const transactionHash = transHash;

                  const transactionDetailsRef = ref(
                    database,
                    `quiz_staking/${quizCode}/transactionDetails`
                  );

                  firebaseUpdate(transactionDetailsRef, {
                    ...transactionDetails,
                    transactionHash: transactionHash,
                  });

                  const link = `https://edu-chain-testnet.blockscout.com/tx/${transactionHash}`;
                  setTransactionLink(link);

                  toast.success(
                    `Reward has been sent. View transaction below`,
                    {
                      position: "top-right",
                      autoClose: 4000,
                      hideProgressBar: true,
                      closeOnClick: true,
                      rtl: false,
                      pauseOnFocusLoss: false,
                      draggable: true,
                      pauseOnHover: false,
                    }
                  );
                } else {
                  console.error("Failed to get valid transaction hash.");
                }
              } catch (error) {
                console.error("Error fetching transaction hash:", error);
              }

              /*   let transHash = await fetchArr(top_3_winners)
          .then((r)=>{
            boolTrns = true;
            return r;
          })

            if(boolTrns){

              console.log(transHash, " message for transaction hash, admin only");
                const transactionHash = transHash;
                const transactionDetailsRef = ref(
                    database,
                    `quiz_staking/${quizCode}/transactionDetails`
                  );
  
                  firebaseUpdate(transactionDetailsRef, {
                    ...transactionDetails,
                    transactionHash: transactionHash,
                  });
  
                  const link = `https://sepolia.basescan.org/tx/${transactionHash}`;
                  setTransactionLink(link);
                  
                  toast.success(
                    `Reward has been sent to ${top_3_winners[0]}, ${top_3_winners[1]}, and ${top_3_winners[2]}`,
                    {
                      position: "top-right",
                      autoClose: 4000,
                      hideProgressBar: true,
                      closeOnClick: true,
                      rtl: false,
                      pauseOnFocusLoss: false,
                      draggable: true,
                      pauseOnHover: false,
                    }
                  );
            } //end of if */
            };
            quizcodeasync();
          } else {
            setContractAddress(null);
          }
        }
      );
      return () => unsubscribeTransactionDetails();
    }
    //quizcodeasync();
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

  const getWinnerClasses = (index) => `
    ${getScoreColor(index)}
    relative
    ${index === 0 ? "animate-sparkle" : ""}
  `;

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen flex flex-col items-center justify-center overflow-hidden p-4"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <style jsx global>{`
        @keyframes sparkle {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-sparkle::before,
        .animate-sparkle::after {
          content: "";
          position: absolute;
          inset: -2px;
          z-index: -1;
          background: linear-gradient(
            45deg,
            #ffd700,
            #ffec80,
            #ffd700,
            #ffe44d,
            #ffd700
          );
          background-size: 200% 200%;
          animation: sparkle 2s linear infinite;
          border-radius: 1rem;
        }

        .animate-sparkle::after {
          filter: blur(8px);
        }
      `}</style>

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
                    ${getWinnerClasses(index)}
                  `}
                >
                  <div className="flex flex-col items-center">
                    {index === 0 && (
                      <Sparkles className="absolute top-0 right-0 text-yellow-400 w-6 h-6 transform -translate-y-1/2 translate-x-1/2" />
                    )}
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
                {leaderboardData.map((player, index) => (
                  <li
                    key={index}
                    className={`
                      flex justify-between items-center py-3 px-4 
                      ${index < 3 ? "bg-opacity-10" : ""}
                      ${player.name === currentUser ? "bg-yellow-100" : ""} 
                      hover:bg-blue-50 transition-colors
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <span className="text-sm md:text-base font-semibold">
                        {player.name}
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
      {transactionLink && (
        <div className="flex justify-center mt-4">
          <a
            href={transactionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Verify Distribution
          </a>
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ top: "150px" }} // Adjusted to show below navigation
      />
    </motion.div>
  );
}
