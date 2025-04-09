import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Trophy, Clock } from "lucide-react";

const PreviewQuizPage = ({ quizTitle, questions, goBack }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const handleBack = () => goBack();
  const handleAnswerSelect = (index) => setSelectedAnswer(index);
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    }
  };
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub Header */}
      <div className="fixed top-16 left-0 right-0 bg-white shadow-md p-4 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg mt-1 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold mt-2 text-gray-800">
              {quizTitle || "Buildathon Quiz"}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-36 px-4 pb-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-0">
          {/* Leaderboard Panel */}
          <div className="bg-white rounded-l-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Leaderboard</h2>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>

            <div className="space-y-4 mb-8">
              {[
                { name: "The Panther", score: 0, position: 1 },
                { name: "Eagle Eye", score: 0, position: 2 },
                { name: "Pen Princess", score: 0, position: 3 },
              ].map((player, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {player.position}
                    </span>
                    <span className="font-medium text-gray-700">
                      {player.name}
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">00:30</span>
            </div>
          </div>

          {/* Quiz Panel */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-r-lg shadow-lg p-8">
            {/* Question Navigation */}
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-white">
                Question {currentQuestionIndex + 1}/{questions.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white text-center">
                {currentQuestion.text}
              </h3>
            </div>

            {/* Options */}
            <div className="grid md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`
                    p-6 rounded-xl text-center font-medium text-lg transition-all transform hover:scale-[1.02]
                    ${
                      selectedAnswer === idx
                        ? "bg-white text-blue-600 shadow-lg"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewQuizPage;
