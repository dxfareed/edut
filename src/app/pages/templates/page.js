"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./quizcreationpage.module.css";
import PreviewQuizPage from "./previewquestion";
import { useRouter } from "next/navigation";
import {
  getDatabase,
  database,
  ref,
  set,
  push,
  onValue,
} from "@/config/FirebaseConfig.js";
import { useActiveAccount, useWalletBalance } from "thirdweb/react";

// Function to generate a random 5-character quiz code
const generateQuizCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let quizCode = "TBF";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    quizCode += characters[randomIndex];
  }
  return quizCode;
};

const STORAGE_KEY = "quiz_draft";
const QuizCreationPage = () => {
  const account = useActiveAccount();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { id: 1, text: "", options: ["", "", "", ""], correctAnswer: null },
  ]);
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [templateCode, setTemplateCode] = useState(""); // To store the template code
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch template data from Firebase
  useEffect(() => {
    const storedTemplateCode = sessionStorage.getItem("templateCode");
    if (storedTemplateCode) {
      setTemplateCode(storedTemplateCode);
      console.log(storedTemplateCode);

      const db = getDatabase();
      const templateRef = ref(db, `templates/${storedTemplateCode}`);
      console.log(templateRef);

      onValue(templateRef, (snapshot) => {
        const templateData = snapshot.val();
        if (templateData) {
          setTitle(templateData.title || "");
          setQuestions(templateData.questions || []);
        } else {
          console.error("Template data not found in Firebase.");
        }
      });
    }
  }, []);

  // Save a draft to localStorage
  useEffect(() => {
    const saveDraft = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            savedTitle: title,
            savedQuestions: questions,
          })
        );
      } catch (error) {
        console.error("Error saving draft to localStorage:", error);
      }
    };
    if (
      title.trim() !== "" ||
      questions.some(
        (q) =>
          q.text.trim() !== "" || q.options.some((opt) => opt.trim() !== "")
      )
    ) {
      saveDraft();
    }
  }, [title, questions]);

  // Add a new question
  const addQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      text: "",
      options: ["", "", "", ""],
      correctAnswer: null,
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newQuestion.id);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Remove a question
  const removeQuestion = (id) => {
    if (questions.length === 1) return; // Prevent removal if only one question is left
    const updatedQuestions = questions.filter((q) => q.id !== id);

    // If the deleted question is the active one, set the active question to the first remaining question
    if (activeQuestion === id) {
      setActiveQuestion(updatedQuestions[0]?.id || 1);
    }

    setQuestions(updatedQuestions);
  };

  // Update question text
  const updateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // Update question options
  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, index) =>
                index === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  // Set the correct answer
  const setCorrectAnswer = (questionId, optionIndex) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              correctAnswer: optionIndex,
            }
          : q
      )
    );
  };

  const isFormValid = () => {
    return (
      title.trim() !== "" &&
      questions.every(
        (q) =>
          q.text.trim() !== "" &&
          q.options.every((opt) => opt.trim() !== "") &&
          q.correctAnswer !== null
      )
    );
  };

  const canEnterPreview = () => {
    return questions.every(
      (q) =>
        q.text.trim() !== "" && // Ensure the question has text
        q.options.every((opt) => opt.trim() !== "") // Ensure all options have text
    );
  };

  // Toggle between preview mode and edit mode
  const togglePreview = () => {
    if (canEnterPreview()) {
      setIsPreviewMode(!isPreviewMode);
    } else {
      alert("Please complete all questions and options before previewing.");
    }
  };

  // Save the quiz to Firebase with generated quiz code
  const saveQuizToFirebase = () => {
    if (!isFormValid()) {
      alert("Please complete all fields before saving.");
      return;
    }

    setLoading(true);

    // Retrieve the wallet address from session storage
    let storedWalletAddress = account?.address;

    // If no wallet is connected, generate a random serial number
    if (!storedWalletAddress) {
      const randomSerial = `NW-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;
      localStorage.setItem("randomSerial", randomSerial);
      storedWalletAddress = randomSerial;
    }

    // Generate the quiz code
    const quizCode = generateQuizCode();
    sessionStorage.setItem("inviteCode", quizCode);
    localStorage.setItem("inviteCode", quizCode);
    localStorage.removeItem(STORAGE_KEY);

    const quizData = {
      title,
      questions,
      quizCode,
      walletAddress: storedWalletAddress,
      timestamp: Date.now(),
      game_start: false,
    };

    // Define Firebase references
    const quizcodeRef = ref(database, `quizcode/${storedWalletAddress}`);
    const quizRef = ref(database, `quizzes/${quizCode}`);

    // Save data to Firebase
    set(quizRef, quizData)
      .then(() => set(quizcodeRef, quizCode))
      .then(() => {
        setLoading(false);
        router.push("./creategame07");
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error saving quiz data:", error);
      });
  };

  const handleQuestionSelect = (id) => {
    const currentQuestion = questions.find((q) => q.id === activeQuestion);
    if (currentQuestion && !currentQuestion.text.trim()) {
      if (!confirm("Current question is empty. Switch anyway?")) {
        return;
      }
    }
    setActiveQuestion(id);
  };

  // Ensure activeQuestion is a valid index
  const activeQuestionIndex = questions.findIndex(
    (q) => q.id === activeQuestion
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-xl font-semibold text-blue-600">
            Saving quiz, please wait...
          </p>
          {/* You can add a spinner here if needed */}
        </div>
      ) : (
        <>
          {isPreviewMode ? (
            <PreviewQuizPage
              quizTitle={title}
              questions={questions}
              goBack={() => setIsPreviewMode(false)}
            />
          ) : (
            <>
              {/* Mobile/Desktop responsive header */}
              <div className="fixed top-14 left-0 right-0 bg-white text-black z-10 shadow-md">
                {/* Mobile header */}
                <div className="md:hidden flex flex-col bg-white fixed top-[64px] left-0 right-0 z-[999]">
                  {/* Main header with title input */}
                  <div className="flex items-center p-4 border-b">
                    <button
                      onClick={() => router.back()}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft size={24} />
                    </button>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Input title here"
                      className="ml-4 text-lg text-black bg-transparent focus:outline-none flex-1"
                    />
                  </div>

                  {/* Sub header with action buttons only */}
                  <div className="flex flex-col p-3 gap-3 border-b">
                    {/* Action buttons row */}
                    <div className="flex gap-2 w-full">
                      <button
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200 transition-colors"
                        onClick={togglePreview}
                      >
                        Preview
                      </button>
                      <button
                        onClick={saveQuizToFirebase}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop header - unchanged */}
                <div className="hidden md:flex items-center justify-between p-6">
                  <div className="flex items-center flex-grow">
                    <button
                      onClick={() => router.back()}
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft size={24} />
                    </button>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Input title here"
                      className="ml-4 text-2xl bg-transparent border-b-5 text-black border-gray-400 focus:outline-none focus:border-blue-300 transition-colors w-1/2 px-4 py-2"
                    />
                  </div>

                  <div className="flex pt-2 items-center space-x-2">
                    <button
                      className="px-4 py-2 rounded-full border border-gray-400 hover:bg-gray-100 transition-colors"
                      onClick={togglePreview}
                    >
                      Preview
                    </button>
                    <button
                      onClick={saveQuizToFirebase} // Trigger save on click
                      className={`px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors text-white`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile/Desktop responsive main content */}
              <main className="pt-[128px] px-4 w-full">
                {/* Mobile view */}
                <div className="md:hidden w-full mt-24">
                  {" "}
                  {/* Adjusted margin-top to account for fixed header */}
                  {/* Question tabs moved above */}
                  <div className="flex overflow-x-auto py-2 space-x-2 no-scrollbar mb-2">
                    {questions.map((q, index) => (
                      <button
                        key={q.id}
                        onClick={() => handleQuestionSelect(q.id)}
                        className={`flex items-center space-x-2 whitespace-nowrap px-6 py-2 rounded-full ${
                          activeQuestion === q.id
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span>{`Q${index + 1}`}</span>
                        {questions.length > 1 && (
                          <Trash2
                            size={16}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(q.id);
                            }}
                            className={`${
                              activeQuestion === q.id
                                ? "text-white"
                                : "text-red-500"
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Add question button moved below tabs */}
                  <button
                    onClick={addQuestion}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center mb-2"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Question
                  </button>
                  {/* Question input modal */}
                  <div className="bg-white rounded-lg p-4">
                    <textarea
                      value={questions[activeQuestionIndex]?.text || ""}
                      onChange={(e) =>
                        updateQuestion(activeQuestion, "text", e.target.value)
                      }
                      placeholder="In what year was Bitcoin created?"
                      className="w-full p-2 text-black mb-4 text-lg border-0 focus:outline-none"
                      rows={3}
                    />
                    <div className="space-y-3 text-black">
                      {["A", "B", "C", "D"].map((letter, index) => (
                        <div
                          key={letter}
                          onClick={() =>
                            setCorrectAnswer(activeQuestion, index)
                          }
                          className={`p-4 rounded-xl flex items-center text-black space-x-3 cursor-pointer transition-all ${
                            questions[activeQuestionIndex].correctAnswer ===
                            index
                              ? "bg-green-50 border-2 border-green-500"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div
                              className={`w-5 h-5 rounded-full text-black border-2 flex items-center justify-center ${
                                questions[activeQuestionIndex].correctAnswer ===
                                index
                                  ? "border-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {questions[activeQuestionIndex].correctAnswer ===
                                index && (
                                <div className="w-3 h-3 text-black rounded-full bg-green-500" />
                              )}
                            </div>
                            <span className="font-medium text-black min-w-[24px]">
                              {letter}
                            </span>
                            <input
                              type="text"
                              value={
                                questions[activeQuestionIndex].options[index]
                              }
                              onChange={(e) =>
                                updateOption(
                                  activeQuestion,
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="Enter option"
                              className="flex-1 bg-transparent text-black border-0 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop view */}
                <div className="hidden md:block">
                  <main className="pt-8 px-4 flex justify-center items-center w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full md:w-3/4 lg:w-2/3 bg-white rounded-lg shadow-lg p-8"
                      style={{ height: "400px" }}
                    >
                      <div className="flex h-full">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="w-1/4 pr-4 flex flex-col justify-between"
                        >
                          <div
                            className={`flex-grow text-black overflow-y-auto ${styles["no-scrollbar"]}`}
                          >
                            {questions.map((q, index) => (
                              <motion.div
                                key={q.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-full flex justify-between items-center mb-2 p-2 rounded ${
                                  activeQuestion === q.id
                                    ? "bg-blue-100 border-l-4 border-blue-500"
                                    : "bg-white"
                                }`}
                              >
                                <button
                                  className="text-left text-black flex-grow"
                                  onClick={() => handleQuestionSelect(q.id)}
                                >
                                  Question {index + 1}
                                </button>
                                <button
                                  onClick={() => removeQuestion(q.id)}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={addQuestion}
                            className="w-full p-2 mt-4 bg-blue-500 text-white text-black rounded flex items-center justify-center"
                          >
                            <Plus size={20} className="mr-2" />
                          </motion.button>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-3/4"
                        >
                          {questions.map(
                            (q) =>
                              q.id === activeQuestion && (
                                <div key={q.id}>
                                  <textarea
                                    value={q.text}
                                    onChange={(e) =>
                                      updateQuestion(
                                        q.id,
                                        "text",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Input question here"
                                    className="w-full p-2 mb-4 text-xl border-b-2 text-black focus:border-blue-500 transition-colors"
                                    rows={3}
                                    style={{ resize: "none" }}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    {["A", "B", "C", "D"].map(
                                      (letter, index) => (
                                        <div
                                          key={letter}
                                          className="flex items-center"
                                        >
                                          <input
                                            type="radio"
                                            name={`correct-answer-${q.id}`}
                                            checked={q.correctAnswer === index}
                                            onChange={() =>
                                              setCorrectAnswer(q.id, index)
                                            }
                                            className="mr-2 text-black"
                                          />
                                          <span className="mr-2 text-lg text-black font-semibold">
                                            {letter}
                                          </span>
                                          <input
                                            type="text"
                                            value={q.options[index]}
                                            onChange={(e) =>
                                              updateOption(
                                                q.id,
                                                index,
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Option ${letter}`}
                                            className="flex-grow text-black p-2 border-b-2 focus:border-blue-500 transition-colors"
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  </main>
                </div>
              </main>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default QuizCreationPage;
