"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./quizcreationpage.module.css";
import PreviewQuizPage from "./previewquestion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { getDatabase, database, ref, set, push } from "@/config/FirebaseConfig";
import { useActiveAccount } from "thirdweb/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

//every line matter be carefull

// Function to generate a random 5-character quiz code
//please leave it as it is most of the code logic affect other part of the game
const generateQuizCode = () => {
  let quizCode = "TBP";
  const characters = "ABCDEF1234567890";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    quizCode += characters[randomIndex];
  }
  return quizCode;
};
const STORAGE_KEY = "quiz_draft";
const LAST_GENERATION_KEY = "last_ai_generation";
const COOLDOWN_PERIOD = 60000;

const QuizCreationPage = () => {
  const { address: useraddress } = useAccount();
  const account = useActiveAccount();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { id: 1, text: "", options: ["", "", "", ""], correctAnswer: null },
  ]);

  const [isMobile, setIsMobile] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  const [activeQuestion, setActiveQuestion] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false); // State to handle preview
  const [loading, setLoading] = useState(false);

  const [isAutoGenModalOpen, setIsAutoGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [isMounted, setIsMounted] = useState(false); // New state to track if component is mounted

  const openAutoGenModal = () => setIsAutoGenModalOpen(true);
  const closeAutoGenModal = () => setIsAutoGenModalOpen(false);

  const retrieveGeneratedQuestions = () => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    console.log("Saved Draft:", savedDraft); // Check the format and content
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Validate the structure of the parsed draft
        if (
          parsedDraft &&
          Array.isArray(parsedDraft.savedQuestions) &&
          typeof parsedDraft.savedTitle === "string"
        ) {
          setQuestions(parsedDraft.savedQuestions);
          setTitle(parsedDraft.savedTitle);
          toast.success("Questions generated successfully!", {
            autoClose: 3000,
          });
        } else {
          throw new Error("Invalid draft structure");
        }
      } catch (error) {
        console.error(
          "Error loading generated questions from localStorage:",
          error
        );
        toast.error(
          "Error loading generated questions. Please check the draft format.",
          { autoClose: 3000 }
        );
      }
    }
  };

  const AutoGenModal = ({ isOpen, onClose, isGenerating }) => {
    const [formState, setFormState] = useState({
      topic: "",
      difficulty: "easy",
      tone: "professional",
      numQuestions: "5",
    });
    const [validationError, setValidationError] = useState("");

    // Reset form and errors when modal closes
    useEffect(() => {
      if (!isOpen) {
        setFormState({
          topic: "",
          difficulty: "easy",
          tone: "professional",
          numQuestions: "5",
        });
        setValidationError("");
      }
    }, [isOpen]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear validation error when user starts typing
      if (name === "topic" && validationError) {
        setValidationError("");
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      // Enhanced validation
      if (!formState.topic.trim()) {
        setValidationError("Please enter a topic");
        toast.error("Please enter a topic");
        return;
      }

      if (formState.topic.length < 3) {
        setValidationError("Topic must be at least 3 characters long");
        toast.error("Topic must be at least 3 characters long");
        return;
      }

      // Check rate limit
      const lastGeneration = localStorage.getItem(LAST_GENERATION_KEY);
      const now = Date.now();

      if (lastGeneration) {
        const timeElapsed = now - parseInt(lastGeneration);
        if (timeElapsed < COOLDOWN_PERIOD) {
          const remainingSeconds = Math.ceil(
            (COOLDOWN_PERIOD - timeElapsed) / 1000
          );
          toast.error(
            `Please wait ${remainingSeconds} seconds before generating again.`
          );
          return;
        }
      }

      setIsGenerating(true);
      toast.info("Generating questions...", {
        toastId: "generating",
        autoClose: false,
      });

      try {
        const genAI = new GoogleGenerativeAI(
          process.env.NEXT_PUBLIC_GEMINI_API_KEY
        );
        const model = genAI.getGenerativeModel({
          model: "tunedModels/triviabase-ai-7o7zd5w99tmz",
        });

        const prompt = `i need the complete JSON schema output only, alway include the "saved_title". Topic: ${formState.topic}, difficulty level: ${formState.difficulty}, number of questions: ${formState.numQuestions}, tone of voice: ${formState.tone}.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Store in localStorage and update UI
        localStorage.setItem(STORAGE_KEY, responseText);
        // Update last generation timestamp
        localStorage.setItem(LAST_GENERATION_KEY, now.toString());

        retrieveGeneratedQuestions();

        toast.dismiss("generating");
        toast.success("Questions generated successfully!", {
          toastId: "success",
        });
        onClose();
      } catch (error) {
        console.error("Error during auto-generation:", error);
        toast.dismiss("generating");
        toast.error(
          error.message || "Failed to generate questions. Please try again."
        );
      } finally {
        setIsGenerating(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-slideUp">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Auto Generate Questions
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isGenerating}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Topic Input with validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="topic"
                value={formState.topic}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                  ${validationError ? "border-red-500" : "border-gray-300"}`}
                placeholder="Enter quiz topic"
                disabled={isGenerating}
              />
              {validationError && (
                <p className="mt-1 text-sm text-red-500">{validationError}</p>
              )}
            </div>

            {/* Difficulty Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                name="difficulty"
                value={formState.difficulty}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="very hard">Expert Level</option>
              </select>
            </div>

            {/* Tone Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone of Voice
              </label>
              <select
                name="tone"
                value={formState.tone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="humorous">Humorous</option>
                <option value="educational">Educational</option>
              </select>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <select
                name="numQuestions"
                value={formState.numQuestions}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
              </select>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    console.log("Saved Draft:", savedDraft); // Check the format and content
    if (savedDraft) {
      try {
        const { savedTitle, savedQuestions } = JSON.parse(savedDraft);
        setTitle(savedTitle);
        setQuestions(savedQuestions);
      } catch (error) {
        console.error("Error loading draft from localStorage:", error);
        toast.error("Error loading saved draft.", { autoClose: 3000 });
      }
    }
  }, []);

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
        toast.error("Error saving draft.", { autoClose: 3000 });
      }
    };
    // Only save if there's actual content
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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const canEnterPreview = () => {
    // Debugging logs to check the state of questions
    console.log("Checking if can enter preview...");
    console.log("Questions:", questions);

    if (title.trim() === "") {
      toast.warn("Please enter a quiz title.", { autoClose: 3000 });
      return false;
    }
    for (const q of questions) {
      if (q.text.trim() === "") {
        toast.warn("Please complete all question fields.", { autoClose: 3000 });
        return false;
      }
      if (q.options.some((opt) => opt.trim() === "")) {
        toast.warn("Please complete all option fields for each question.", {
          autoClose: 3000,
        });
        return false;
      }
      if (q.correctAnswer === null) {
        toast.warn("Please select a correct answer for each question.", {
          autoClose: 3000,
        });
        return false;
      }
    }
    return true;
  };

  // Toggle between preview mode and edit mode
  const togglePreview = () => {
    console.log("Attempting to toggle preview...");
    if (isMobile) {
      toast.warn("Preview is not available in mobile view.", {
        autoClose: 3000,
      });
      return; // Exit the function if in mobile view
    }

    if (canEnterPreview()) {
      console.log("Conditions met for preview. Toggling preview mode.");
      setIsPreviewMode(!isPreviewMode);
    } else {
      console.log("Conditions not met for preview.");
      toast.warn(
        "Please complete all questions, options, and select a correct answer before previewing.",
        { autoClose: 3000 }
      );
    }
  };

  // Function to validate the form
  const isFormValid = () => {
    if (title.trim() === "") {
      toast.warn("Please enter a quiz title.", { autoClose: 3000 });
      return false;
    }
    for (const q of questions) {
      if (q.text.trim() === "") {
        toast.warn("Please complete all question fields.", { autoClose: 3000 });
        return false;
      }
      if (q.options.some((opt) => opt.trim() === "")) {
        toast.warn("Please complete all option fields for each question.", {
          autoClose: 3000,
        });
        return false;
      }
      if (q.correctAnswer === null) {
        toast.warn("Please select a correct answer for each question.", {
          autoClose: 3000,
        });
        return false;
      }
    }
    return true;
  };

  // Save the quiz to Firebase with generated quiz code
  const saveQuizToFirebase = async () => {
    if (!isFormValid()) {
      return;
    }

    let storedWalletAddress;
    try {
      storedWalletAddress = account.address;
      if (!storedWalletAddress) {
        toast.error("Please connect your wallet before saving the quiz", {
          autoClose: 3000,
        });
        return;
      }
    } catch (error) {
      setLoading(false);
      toast.error("Please connect your wallet before saving the quiz", {
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    // Generate the quiz code
    const quizCode = generateQuizCode();
    console.log(quizCode);

    const quizData = {
      title,
      questions,
      quizCode,
      walletAddress: storedWalletAddress,
      timestamp: Date.now(),
      game_start: false,
      quiz_checker: false,
    };

    // Define Firebase references for quiz data and user generated quizzes
    const quizcodeRef = ref(database, `paid_quizcode/${storedWalletAddress}`);
    const quizRef = ref(database, `paid_quizzes/${quizCode}`);
    const userGeneratedQuizRef = ref(
      database,
      `user_generated_quizzes/${storedWalletAddress}/${quizCode}`
    );

    try {
      // Save data to Firebase for both quiz data and user generated quizzes
      await Promise.all([
        set(quizRef, quizData),
        set(userGeneratedQuizRef, {
          quizCode,
          timestamp: Date.now(),
          walletAddress: storedWalletAddress,
        }),
        set(quizcodeRef, {
          quizCode,
          timestamp: Date.now(),
        }),
      ]);
      setLoading(false);
      router.push("./enter_mail");
      toast.success("Quiz saved successfully!", { autoClose: 3000 });
    } catch (error) {
      setLoading(false);
      console.error("Error saving quiz data:", error);
      toast.error("Error saving quiz. Check network and try again.", {
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    // Detect mobile screen
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust breakpoint as needed
    };

    // Call it on mount
    checkMobile();
    setIsMounted(true); // Set mounted to true after checking screen size

    // And add event listener for resize
    window.addEventListener("resize", checkMobile);

    // Clean up event listener on unmount
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleAddQuestion = () => {
    const newId =
      questions.length > 0 ? questions[questions.length - 1].id + 1 : 1;
    const newQuestion = {
      id: newId,
      text: "", // Initialize with empty text
      options: ["", "", "", ""], // Initialize with empty strings
      correctAnswer: null, // Initialize correctAnswer for the new question
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newId);
  };

  const handleQuestionClick = (id) => {
    setActiveQuestion(id);
  };

  // ... existing code ...
  const handleDeleteQuestion = (id) => {
    if (questions.length <= 1) {
      alert("Cannot delete the last question.");
      return;
    }

    const updatedQuestions = questions.filter((q) => q.id !== id);
    setQuestions(updatedQuestions);

    // If the deleted question was the active question, update activeQuestion
    if (activeQuestion === id) {
      if (updatedQuestions.length > 0) {
        // Select the first question in the updated list
        setActiveQuestion(updatedQuestions[0].id);
      } else {
        // If there are no questions left, you might want to reset activeQuestion to null or a default value
        setActiveQuestion(null); // Or any other appropriate default value
      }
    }
  };

  const updateQuestionText = (newText) => {
    setQuestions(
      questions.map((q) =>
        q.id === activeQuestion ? { ...q, text: newText } : q
      )
    );
  };

  const updateOptionText = (index, newText) => {
    setQuestions(
      questions.map((q) =>
        q.id === activeQuestion
          ? {
              ...q,
              options: q.options.map((option, i) =>
                i === index ? newText : option
              ),
            }
          : q
      )
    );
  };

  const handleCorrectOptionSelect = (index) => {
    setQuestions(
      questions.map((q) =>
        q.id === activeQuestion
          ? { ...q, correctAnswer: index } // Update correctAnswer here
          : q
      )
    );
  };

  const getCorrectOptionStyle = (questionId, optionIndex) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.correctAnswer === optionIndex) {
      return "bg-[#EAEAFF] border-[#EAEAFF] text-green-400"; // Styling for correct option
    }
    return "bg-[#FBFBFB] border-[#FBFBFB] focus:ring-blue-200"; // Default styling
  };

  const getLabelStyle = (questionId, optionIndex) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.correctAnswer === optionIndex) {
      return "bg-blue-100 text-green-400 cursor-pointer"; // Styling for correct option
    }
    return "bg-white text-gray-500 cursor-pointer"; // Default styling
  };

  // Render mobile view only if mounted
  if (isMobile && isMounted) {
    const handleQuestionSelect = (id) => {
      setActiveQuestion(id);
      setShowQuestionEditor(true);
    };

    const handleBackToList = () => {
      setShowQuestionEditor(false);
    };

    return (
      <div className="min-h-screen bg-gray-100 font-sans antialiased">
        {!showQuestionEditor ? (
          // Questions List View
          <>
            {/* List View Header */}
            <div className="sticky mt-20 top-0 bg-white p-4 shadow-sm z-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center flex-1">
                  <button onClick={() => router.back()} className="p-2 -ml-2">
                    <Image
                      src="/arrowleft.svg"
                      alt="Back"
                      width={20}
                      height={20}
                      className="bg-white"
                    />
                  </button>
                  <input
                    type="text"
                    placeholder="Input title here"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-semibold bg-transparent focus:outline-none flex-1 ml-2 text-[#4E4E4E]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log("Preview button clicked");
                    togglePreview();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg text-black text-sm font-medium bg-white border border-[#DBE7FF]"
                >
                  Preview
                </button>
                <button
                  onClick={saveQuizToFirebase}
                  className="flex-1 py-2 px-3 rounded-lg text-white text-sm font-medium bg-blue-600 shadow-[0px_1px_2px_0px_#1018280D] flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <>
                      Save
                      <Image
                        src="/arrowwh.svg"
                        alt="Save"
                        width={14}
                        height={14}
                        className="ml-2"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="mt-4 mx-4">
              <div className="bg-[#FBFBFB] border-8 border-white rounded-xl h-[700px] flex flex-col items-center">
                <div
                  style={{ overflowY: "auto" }}
                  className={`max-h-[630px] p-4 w-full ${styles.noScrollbar} scrollbar-hide`}
                >
                  {questions.map((question) => (
                    <div key={question.id} className="relative mb-3">
                      <button
                        onClick={() => handleQuestionSelect(question.id)}
                        className={`w-full py-3 px-4 rounded-lg text-left flex items-center justify-between ${
                          activeQuestion === question.id
                            ? "bg-blue-50 text-blue-600"
                            : "bg-white"
                        }`}
                      >
                        <span className="font-medium">
                          <span className="text-blue-500">{question.id}.</span>{" "}
                          Question {question.id}
                        </span>
                        {question.text && (
                          <span className="text-green-500 text-sm font-medium mr-4">
                            Set
                          </span>
                        )}
                      </button>
                      {/* Delete Button for Mobile View */}
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        <Image
                          src="/icons/delete.svg"
                          alt="Delete"
                          width={12}
                          height={12}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Question Button */}
                <button
                  onClick={handleAddQuestion}
                  className="w-11/12 px-14 py-3 rounded-lg bg-white border border-[#DBE7FF] text-blue-600 font-bold hover:bg-blue-100 transition-colors mt-auto mb-4"
                >
                  +
                </button>
              </div>
            </div>
          </>
        ) : (
          // Question Editor View
          <>
            {/* Editor View Header */}
            <div className="sticky mt-20 top-0 bg-white p-4 shadow-sm z-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center flex-1">
                  <button onClick={handleBackToList} className="p-2 -ml-2">
                    <Image
                      src="/arrowleft.svg"
                      alt="Back"
                      width={20}
                      height={20}
                      className="bg-white"
                    />
                  </button>
                  <span className="text-lg font-semibold ml-2 text-[#4E4E4E]">
                    Question {activeQuestion}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log("Preview button clicked");
                    togglePreview();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg text-black text-sm font-medium bg-white border border-[#DBE7FF]"
                >
                  Preview
                </button>
                <button
                  onClick={saveQuizToFirebase}
                  className="flex-1 py-2 px-3 rounded-lg text-white text-sm font-medium bg-blue-600 shadow-[0px_1px_2px_0px_#1018280D] flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <>
                      Save
                      <Image
                        src="/arrowwh.svg"
                        alt="Save"
                        width={14}
                        height={14}
                        className="ml-2"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Question Editor Content */}
            <div className="p-4">
              <div className="bg-white border-8 border-white rounded-xl p-4 mb-4">
                {/* Added Question Tab */}
                <div className="bg-white border-8 border-[#FBFBFB] p-3 rounded-xl mb-4">
                  <span className="text-blue-500">{activeQuestion}. </span>{" "}
                  Question {activeQuestion}
                </div>
                {/* Question Input */}
                <textarea
                  placeholder="Input question here"
                  className="w-full h-24 p-4 rounded-lg text-xl font-medium border-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-shadow resize-none text-center mb-6"
                  value={questions.find((q) => q.id === activeQuestion)?.text}
                  onChange={(e) => updateQuestionText(e.target.value)}
                />
                {/* Auto Generate Button */}
                <div className="flex justify-center">
                  <Image
                    src="/icons/ai.svg"
                    alt="Auto Generate"
                    width={16}
                    height={16}
                    className="mr-2"
                    onClick={() => setIsAutoGenModalOpen(true)}
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {questions
                    .find((q) => q.id === activeQuestion)
                    .options.map((option, index) => (
                      <div key={index} className="relative">
                        <label
                          className={`absolute bg-white -ml-3 py-7 px-4 left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg ${
                            questions.find((q) => q.id === activeQuestion)
                              .correctAnswer === index
                              ? "bg-[#EAEAFF] text-green-400"
                              : "bg-gray-50 text-gray-500"
                          }`}
                          onClick={() => handleCorrectOptionSelect(index)}
                        >
                          {String.fromCharCode(65 + index)}
                        </label>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          className={`w-full py-5 pl-14 pr-4 rounded-lg ${
                            questions.find((q) => q.id === activeQuestion)
                              .correctAnswer === index
                              ? "bg-blue-50 border-[#EAEAFF] text-green-400"
                              : "bg-gray-100 border-gray-100"
                          } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                          value={option}
                          onChange={(e) =>
                            updateOptionText(index, e.target.value)
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}
        <AutoGenModal
          isOpen={isAutoGenModalOpen}
          onClose={() => setIsAutoGenModalOpen(false)}
          isGenerating={isGenerating}
        />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    );
  }

  // Render PreviewQuizPage if in preview mode
  if (isPreviewMode) {
    console.log("Rendering PreviewQuizPage...");
    return (
      <PreviewQuizPage
        quizTitle={title}
        questions={questions}
        goBack={() => {
          console.log("Going back to editor from preview.");
          setIsPreviewMode(false); // Function to go back to the editor
        }} // Function to go back to the editor
      />
    );
  }

  // Render desktop view only if mounted
  if (!isMobile && isMounted) {
    // Desktop View - Your original code
    return (
      <div className="min-h-screen bg-gray-100 font-sans antialiased">
        {/* Sub-Header */}
        <div className="sticky mt-20 top-0 bg-white p-4 shadow-md mb-6 z-50">
          {" "}
          {/* Increased z-index here */} {/*  Make sticky  */}
          <div className="flex items-center justify-between">
            <div className=" ml-32 flex items-center ">
              <button onClick={() => router.back()} className="mr-4">
                <Image
                  src="/arrowleft.svg"
                  alt="Back"
                  width={24}
                  height={24}
                  className="bg-white "
                />
              </button>
              <input
                type="text"
                placeholder="Input title here"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold bg-transparent focus:outline-none w-96 text-[#4E4E4E]"
              />
            </div>

            <div className="space-x-4 flex mr-24">
              <button
                onClick={() => {
                  console.log("Preview button clicked");
                  togglePreview();
                }}
                className="py-2 px-4 rounded-lg text-black font-semibold bg-white border border-[#DBE7FF] hover:bg-blue-50 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={saveQuizToFirebase}
                className="py-2 px-4 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors flex items-center shadow-[0px_1px_2px_0px_#1018280D] shadow-[0px_3.04px_0px_0px_#0019CB]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    Save
                    <Image
                      src="/arrowwh.svg"
                      alt="Save"
                      width={16}
                      height={16}
                      className="ml-2"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="container bg-white mt-12 rounded-lg mx-auto p-1">
          <div className="flex">
            {/* Side Panel */}
            <div className="w-52 bg-[#FBFBFB] rounded-lg p-4 mr-8 flex flex-col h-[500px]">
              {/* Adjust height as needed */}
              <nav
                className={`flex-grow overflow-y-auto ${styles.noScrollbar} scrollbar-hide`}
              >
                {questions.map((question) => (
                  <div key={question.id} className="relative">
                    <button
                      onClick={() => handleQuestionClick(question.id)}
                      className={`block py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100 w-full text-left mb-2 ${
                        activeQuestion === question.id ? "bg-gray-100" : ""
                      }`}
                    >
                      {question.id}. Question {question.id}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <Image
                        src="/icons/delete.svg"
                        alt="Delete"
                        width={12}
                        height={12}
                      />
                    </button>
                  </div>
                ))}
              </nav>

              <button
                onClick={handleAddQuestion}
                className="bg-blue-100 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors w-full mt-4 sticky bottom-0"
              >
                {/* Make sticky */}+
              </button>
            </div>

            {/* Question Input */}
            <div className="flex-1 bg-white rounded-lg  p-6">
              <div className="mb-6">
                <button
                  onClick={() => setIsAutoGenModalOpen(true)}
                  className="bg-white text-blue-600 py-2  px-4 rounded-lg hover:bg-blue-50 transition-colors float-right border border-[#B8B8FE]"
                >
                  <Image
                    src="/icons/ai.svg"
                    alt="Auto Generate"
                    width={16}
                    height={16}
                    className="mr-2 inline-block"
                  />
                  Auto generate
                </button>
                <div className="clear-both" />
              </div>

              <textarea
                placeholder="Input question here"
                className="w-full h-32 p-4 rounded-lg font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-200 transition-shadow resize-none text-3xl text-center"
                value={questions.find((q) => q.id === activeQuestion)?.text}
                onChange={(e) => updateQuestionText(e.target.value)}
              />

              {/* Option Inputs */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {questions
                  .find((q) => q.id === activeQuestion)
                  .options.map((option, index) => (
                    <div key={index} className="relative">
                      <label
                        className={`absolute top-1/2 left-6 -translate-y-1/2 rounded-lg -ml-1 py-11 p-6 w-9 h-9 flex items-center justify-center ${
                          questions.find((q) => q.id === activeQuestion)
                            .correctAnswer === index
                            ? "bg-[#EAEAFF] text-green-400"
                            : "bg-gray-50 text-gray-500"
                        }`}
                        onClick={() => handleCorrectOptionSelect(index)}
                      >
                        {String.fromCharCode(65 + index)}
                      </label>
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        className={`w-full p-9 ml-4 pl-14 rounded-lg bg-gray-100 border-[#FBFBFB] focus:outline-none focus:ring-2 transition-shadow ${
                          questions.find((q) => q.id === activeQuestion)
                            .correctAnswer === index
                            ? "bg-blue-50 border-[#EAEAFF] text-green-400"
                            : "bg-gray-100 border-gray-100"
                        }`}
                        value={option}
                        onChange={(e) =>
                          updateOptionText(index, e.target.value)
                        }
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <AutoGenModal
          isOpen={isAutoGenModalOpen}
          onClose={() => setIsAutoGenModalOpen(false)}
          isGenerating={isGenerating}
        />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    );
  }

  return null; // Return null if no view is rendered
};

export default QuizCreationPage;
