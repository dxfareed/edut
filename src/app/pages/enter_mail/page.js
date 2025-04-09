"use client";

import Image from "next/image";
import { getDatabase, ref, get, update } from "@/config/FirebaseConfig";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WinningPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const account = useActiveAccount();
  const [quizCode, setQuizCode] = useState(null);

  useEffect(() => {
    const fetchQuizCode = async () => {
      if (!account?.address) return;
      const storedWalletAddress = account.address;
      console.log(storedWalletAddress);
      const db = getDatabase();
      const quizcodeRef = ref(db, `paid_quizcode/${storedWalletAddress}`);
      try {
        const snapshot = await get(quizcodeRef);
        if (snapshot.exists()) {
          const fetchedQuizCode = snapshot.val().quizCode;
          setQuizCode(fetchedQuizCode);
          console.log("Fetched Quiz Code:", fetchedQuizCode);
        } else {
          console.log("No quiz code found for this wallet address");
        }
      } catch (error) {
        console.error("Error fetching quiz code:", error);
      }
    };

    fetchQuizCode();
  }, [account?.address]);

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setLoading(true);
      const db = getDatabase();
      const storedWalletAddress = account.address;

      // Update existing data in Firebase Realtime Database
      const quizRef = ref(db, `paid_quizzes/${quizCode}`);
      const quizcodeRef = ref(db, `paid_quizcode/${storedWalletAddress}`);

      await update(quizRef, {
        email: email,
      });
      await update(quizcodeRef, {
        email: email,
      });

      router.push("./setreward");
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <ToastContainer />
      <button className="bg-white text-gray-600 h-[72px] flex items-center justify-start mb-1 w-full md:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-14 inline-block ml-4 md:ml-20 bg-white rounded-r-lg shadow-[2px_0px_0px_#DBE7FF]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>

      {/* Email Entry Container */}
      <div className="flex flex-col items-center justify-center flex-grow pt-47">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-96">
          {/* Adjusted width */}
          <div className="bg-[#EDEBFF] rounded-t-lg p-4 mb-4 flex items-center justify-center">
            <Image
              src="/icons/paid.s.png"
              alt="Email Icon"
              width={19}
              height={12}
            />
          </div>
          <h2 className="text-2xl font-semibold text-center mb-4">
            Enter Email Address
          </h2>
          <p className="text-gray-700 text-center mb-6">
            Payment Details would be sent to your Email
          </p>
          <input
            type="email"
            placeholder="Enter your email address"
            className="bg-white p-3 rounded-md w-full mb-4 border border-gray-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            className="bg-[#004EF3] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md w-full flex items-center justify-center"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinningPage;
