"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database, ref, onValue, set } from "@/config/FirebaseConfig";

const LeaderboardComponent = () => {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState([]); // State for leaderboard data
  const [quizTitle, setQuizTitle] = useState(""); // State for quiz title
  const [topScoreUser, setTopScoreUser] = useState({ name: "", score: 0 }); // State for top score users
  const [quizCode, setQuizCode] = useState(null);
  const [isNextQuestionAvailable, setIsNextQuestionAvailable] = useState(false); // New state for button availability

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if the window object is available (client-side)
      const storedQuizCode = sessionStorage.getItem("inviteCode");
      setQuizCode(storedQuizCode);
    }
  }, []);

  useEffect(() => {
    if (quizCode) {
      // Set quiz_checker to false when component loads
      const quizCheckerRef = ref(
        database,
        `paid_quizzes/${quizCode}/quiz_checker`
      );
      set(quizCheckerRef, false);
    }
  }, [quizCode]);

  useEffect(() => {
    // Fetch quiz title from Firebase
    const quizRef = ref(database, `paid_quizzes/${quizCode}/title`);
    const unsubscribeQuizTitle = onValue(quizRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuizTitle(snapshot.val());
      }
    });

    return () => unsubscribeQuizTitle();
  }, [quizCode]);

  useEffect(() => {
    // Fetch leaderboard data from Firebase
    const participantRef = ref(database, `game_participant/${quizCode}`);

    const unsubscribe = onValue(participantRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const participantsArray = Object.entries(data).map(([user, info]) => ({
          name: user,
          score: info.score,
        }));

        // Sort participants by score descending
        const sortedParticipants = participantsArray.sort(
          (a, b) => b.score - a.score
        );

        setLeaderboardData(sortedParticipants);
        // Set top score user
        if (sortedParticipants.length > 0) {
          setTopScoreUser(sortedParticipants[0]);
        }
      } else {
        console.log("No participants found.");
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [quizCode]);

  useEffect(() => {
    // Listen for changes to `next_question` in the database
    const nextQuestionRef = ref(
      database,
      `paid_quizzes/${quizCode}/next_question`
    );

    const unsubscribe = onValue(nextQuestionRef, (snapshot) => {
      if (snapshot.exists()) {
        const nextQuestionState = snapshot.val();
        // Redirect when `next_question` changes to true
        if (nextQuestionState === true) {
          router.push("./paid_host_game_mode");
        }
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [quizCode, router]);

  useEffect(() => {
    const quizRef = ref(database, `paid_quizzes/${quizCode}`);

    const handleData = (snapshot) => {
      const quizData = snapshot.val();

      if (!quizData) {
        router.push("./paid_final_leaderboard");
        return;
      }

      const { current_question: index, questions: questionsData } = quizData;

      if (!questionsData || index >= Object.values(questionsData).length) {
        setIsNextQuestionAvailable(false);
      } else {
        setIsNextQuestionAvailable(true);
      }
    };

    const unsubscribe = onValue(quizRef, handleData);

    return () => unsubscribe();
  }, [quizCode, router]);

  const handleNextQuestion = () => {
    // Set the next_question state in Firebase to true
    const nextQuestionRef = ref(
      database,
      `paid_quizzes/${quizCode}/next_question`
    );
    const quizCheckerRef = ref(
      database,
      `paid_quizzes/${quizCode}/quiz_checker`
    );
    set(nextQuestionRef, true);
    set(quizCheckerRef, true);
  };

  const handleLeaderboard = () => {
    const leaderboardRef = ref(
      database,
      `paid_quizzes/${quizCode}/leaderboard`
    );
    set(leaderboardRef, true);
    router.push("./paid_final_leaderboard");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sub-header */}
      <div className="fixed top-12 mt-[30px] left-0 right-0 bg-white text-black p-4 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center flex-grow">
          <h1 className="text-lg md:text-xl font-medium ml-4">{quizTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={
              isNextQuestionAvailable ? handleNextQuestion : handleLeaderboard
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            {isNextQuestionAvailable ? "Next Question" : "Leaderboard"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mt-[50px] mx-auto px-4 pt-36">
        {/* Top Score User Section */}
        <div className="bg-blue-50 rounded-xl p-8 mb-6">
          {topScoreUser.name && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-600 text-xl">Top Player</span>
              <span className="text-gray-800 text-xl font-medium">
                {topScoreUser.name}: {topScoreUser.score}
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard List */}
        <div className="bg-white rounded-xl">
          {leaderboardData.map((player, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-4 px-4 border-b border-gray-100 last:border-none"
            >
              <span className={`text-gray-800`}>{player.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-blue-600 font-medium">
                  {player.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardComponent;
