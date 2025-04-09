"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { database, ref, onValue, set, get } from "@/config/FirebaseConfig"; // Adjust the import based on your actual path

export default function GamePage() {
  const [quizCode, setQuizCode] = useState(null);
  const [username, setUsername] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20); // Total timer set to 20 seconds
  const [loading, setLoading] = useState(true); // Loading state for waiting for answers
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedQuizCode = sessionStorage.getItem("inviteCode");
      const storedUsername = sessionStorage.getItem("username");
      const storedIndex =
        parseInt(sessionStorage.getItem("currentQuestionIndex"), 10) || 0;

      setQuizCode(storedQuizCode);
      setUsername(storedUsername);
      setCurrentQuestionIndex(storedIndex);

      // Indicate that initialization is complete
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (isInitializing) {
      return;
    }
    if (!quizCode) {
      router.push("./dashboard");
      return;
    }

    const nextQuestionRef = ref(
      database,
      `paid_quizzes/${quizCode}/next_question`
    );
    set(nextQuestionRef, false);

    const questionsRef = ref(database, `paid_quizzes/${quizCode}/questions`);

    const handleQuestionData = (snapshot) => {
      if (snapshot.exists()) {
        const questionsData = snapshot.val();
        const questionsArray = Object.values(questionsData);
        const storedIndex =
          parseInt(sessionStorage.getItem("currentQuestionIndex"), 10) || 0;

        if (questionsArray[storedIndex]) {
          setQuestions(questionsArray);
          setCurrentQuestionIndex(storedIndex);
          setLoading(false);
        } else if (storedIndex >= questionsArray.length) {
          const nextQuestionIndex = 100; // You may want to adjust this logic based on your application needs
          const questionIndexRef = ref(
            database,
            `paid_quizzes/${quizCode}/current_question`
          );
          set(questionIndexRef, nextQuestionIndex); // Use nextQuestionIndex instead of newQuestionIndex
          router.push("./paid_final_leaderboard");
        } else {
          setQuestions(questionsArray);
          setCurrentQuestionIndex(0); // Start from the first question if the stored index is invalid
          sessionStorage.setItem("currentQuestionIndex", 0);
          setLoading(false);
        }
      } else {
        router.push("./paid_final_leaderboard");
      }
    };

    onValue(questionsRef, handleQuestionData);

    // Countdown timer logic
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Save current question index in session storage
          const newQuestionIndex = currentQuestionIndex + 1;
          sessionStorage.setItem("currentQuestionIndex", newQuestionIndex);
          const questionIndexRef = ref(
            database,
            `paid_quizzes/${quizCode}/current_question`
          );
          set(questionIndexRef, newQuestionIndex);
          router.push("./paid_host_leaderboard");
          return 0; // Stop countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // Cleanup the timer
  }, [quizCode, username, router, currentQuestionIndex]);

  // Fetch responses for the current question
  useEffect(() => {
    if (questions.length > 0) {
      const fetchCurrentQuestionIndex = async () => {
        const questionIndexRef = ref(
          database,
          `paid_quizzes/${quizCode}/current_question`
        );
        const questionIndexSnapshot = await get(questionIndexRef);
        return questionIndexSnapshot.val();
      };

      fetchCurrentQuestionIndex().then((currentQuestionIndexFromDB) => {
        const currentQuestion = questions[currentQuestionIndex];
        const participantsRef = ref(
          database,
          `paid_quizzes/${quizCode}/questions/${currentQuestionIndexFromDB}/participant/user_answers`
        );

        const handleResponsesData = (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const responsesArray = Object.entries(data).map(([user, info]) => ({
              name: user,
              score: info.score,
              selectedOption: info.answer,
              timeLeft: info.timeLeft,
              isCorrect: info.answer === currentQuestion.correctAnswer, // Check if answer is correct
            }));
            setResponses(responsesArray);
          } else {
            setResponses([]); // Reset responses if no data
          }
          setLoading(false); // Set loading to false once responses are fetched
        };

        // Attach the listener and store the unsubscribe function
        const unsubscribe = onValue(participantsRef, handleResponsesData);

        // Cleanup the listener on unmount
        return () => {
          unsubscribe();
        };
      });
    }
  }, [questions, currentQuestionIndex, quizCode]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {/* Main Content */}
      <main className="w-full max-w-4xl mt-20 p-6 bg-[#004EF3] rounded-lg shadow-lg text-center">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-[#004EF3] text-white py-4 px-6 rounded-t-lg">
          <div className="text-lg font-bold">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>
          <div className="flex items-center space-x-2">
            <span>Timer</span>
            <span className="bg-white text-[#004EF3] px-3 py-1 rounded">
              {`00:${timeLeft.toString().padStart(2, "0")}`}
            </span>
          </div>
        </div>

        {/* Question Section */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            {questions.length > 0
              ? questions[currentQuestionIndex].text
              : "Loading question..."}
          </h2>
        </div>

        {/* Responses Section */}
        <div className="mt-8">
          <div className="text-lg font-bold text-white">Responses</div>
          <div className="mt-4 p-6 bg-gray-100 rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
                <span>Loading responses...</span>
              </div>
            ) : (
              <div className="text-left">
                {responses.map((response, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-white rounded-lg shadow mb-2"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Player Name */}
                      <span className="text-lg font-semibold">
                        {response.name}
                      </span>
                      {/* Round Milky Button with Vote Count */}
                      <span className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-bold">
                        {response.score}
                      </span>
                    </div>

                    {/* Correct/Incorrect Icon */}
                    <span>
                      {response.isCorrect ? (
                        <div className="text-blue-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
