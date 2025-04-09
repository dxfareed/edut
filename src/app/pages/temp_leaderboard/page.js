"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database, ref, onValue } from "@/config/FirebaseConfig";

const LeaderboardComponent = () => {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizCode, setQuizCode] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQuizCode(sessionStorage.getItem("inviteCode"));
      setUsername(sessionStorage.getItem("username"));
    }
  }, []);

  useEffect(() => {
    const participantRef = ref(database, `game_participant/${quizCode}`);

    const unsubscribe = onValue(participantRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const participantsArray = Object.entries(data).map(([user, info]) => ({
          name: user,
          score: info.score,
          isWinner: user === username,
        }));

        const sortedParticipants = participantsArray.sort(
          (a, b) => b.score - a.score
        );

        setLeaderboardData(sortedParticipants);

        const currentUser = sortedParticipants.find(
          (participant) => participant.name === username
        );
        setUserScore(currentUser ? currentUser.score : 0);
      } else {
        console.log("No participants found.");
      }
    });

    return () => unsubscribe();
  }, [quizCode, username]);

  useEffect(() => {
    const quizRef = ref(database, `quizzes/${quizCode}/title`);
    const unsubscribeQuizTitle = onValue(quizRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuizTitle(snapshot.val());
      }
    });

    return () => unsubscribeQuizTitle();
  }, [quizCode]);

  useEffect(() => {
    const nextQuestionRef = ref(database, `quizzes/${quizCode}/next_question`);
    const leaderboardRef = ref(database, `quizzes/${quizCode}/leaderboard`);

    const unsubscribeNextQuestion = onValue(nextQuestionRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val() === true) {
        router.push("./user_game_mode");
      }
    });

    const unsubscribeLeaderboard = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val() === true) {
        router.push("./leaderboard");
      }
    });

    return () => {
      unsubscribeNextQuestion();
      unsubscribeLeaderboard();
    };
  }, [quizCode, router]);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white text-black p-4 flex items-center justify-between shadow-md z-10">
        <h1 className="text-xl font-bold text-blue-600 uppercase">
          {quizTitle}
        </h1>
        <span className="text-gray-500 text-sm">Game starts soon...</span>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        {/* User Score */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center mb-6">
          <h2 className="text-xl font-semibold text-blue-600">Your Score</h2>
          <p className="text-2xl font-bold text-gray-800">{userScore}</p>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Leaderboard</h2>
          <div>
            {leaderboardData.map((player, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 mb-3 rounded-lg transition-all shadow-md ${
                  player.isWinner
                    ? "bg-blue-100 border-l-4 border-blue-600"
                    : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xl font-bold ${
                      player.isWinner ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-lg ${
                      player.isWinner ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {player.name}
                  </span>
                </div>
                <span
                  className={`text-lg ${
                    player.isWinner ? "text-blue-600" : "text-gray-700"
                  } font-bold`}
                >
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardComponent;
