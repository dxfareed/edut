"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Share2, Copy, Check } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { ref, onValue, get, getDatabase } from "@/config/FirebaseConfig";
import { database } from "@/config/FirebaseConfig";

// Constants
const CONSTANTS = {
  COPY_TIMEOUT: 2000,
  IMAGES: {
    CREDIT: {
      src: "/icons/credit.png",
      alt: "Credit Icon",
      width: 25,
      height: 19,
    },
  },
};

const STYLES = {
  colors: {
    primary: "#004EF3",
    primaryHover: "#0040D0",
    background: {
      modal: "rgba(31, 41, 55, 0.5)",
      section: "#F9FAFB",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      accent: "#004EF3",
    },
  },
  spacing: {
    modal: "24px",
    section: "16px",
  },
};

const WalletModal = () => {
  const account = useActiveAccount();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [quizCode, setQuizCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/pages/join_game`);
    setShareSupported(!!navigator.share);
    const fetchQuizCode = async () => {
      if (!account?.address) return;
      const db = getDatabase();
      const quizcodeRef = ref(db, `paid_quizcode/${account.address}`);
      try {
        const snapshot = await get(quizcodeRef);
        if (snapshot.exists()) {
          const fetchedQuizCode = snapshot.val().quizCode;
          setQuizCode(fetchedQuizCode);
          console.log("Fetched Quiz Code:", fetchedQuizCode);
          // Store the quiz code in session and local storage
          const storageKeys = ["quizCode", "inviteCode"];
          storageKeys.forEach((key) => {
            sessionStorage.setItem(key, fetchedQuizCode);
            localStorage.setItem(key, fetchedQuizCode);
          });
          setIsLoading(false); // Set isLoading to false after fetching quiz code
        } else {
          console.log("No quiz code found for this wallet address");
          setIsLoading(false); // Set isLoading to false even if no quiz code is found
        }
      } catch (error) {
        console.error("Error fetching quiz code:", error);
        setIsLoading(false); // Set isLoading to false in case of an error
      }
    };

    fetchQuizCode();
  }, [account?.address]);

  const shareMessage = `Join my quiz game! Use code: ${quizCode}\n`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), CONSTANTS.COPY_TIMEOUT);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Join My Quiz Game",
        text: shareMessage,
        url: shareUrl,
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const renderGameCode = () => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <p className="text-gray-600 text-sm mb-2">Game Code:</p>
      <div className="flex items-center justify-center space-x-2">
        {isLoading ? (
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded" />
        ) : (
          <>
            <span
              className="text-2xl font-bold"
              style={{ color: STYLES.colors.text.accent }}
            >
              {quizCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-4 text-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-96 transform relative">
          {/* Header */}
          <header
            className="bg-primary p-2 flex justify-between items-center md:px-8 lg:px-16 rounded-t-lg absolute left-0 right-0 top-0"
            style={{ backgroundColor: STYLES.colors.primary }}
          />

          {/* Icon Section */}
          <div className="bg-white rounded-t-lg p-4 mb-4 flex items-center justify-center">
            <Image {...CONSTANTS.IMAGES.CREDIT} className="bg-[#EDEBFF]" />
          </div>

          {/* Title */}
          <h2
            className="text-2xl font-semibold text-center mb-4"
            style={{ color: STYLES.colors.text.primary }}
          >
            Game is all set up
          </h2>

          {/* Game Code Section */}
          {renderGameCode()}

          {/* Share Section */}
          {shareSupported && (
            <div className="space-y-4 mb-6">
              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-2 w-full py-3 px-4 
                          rounded-md border border-gray-200 hover:bg-gray-50 
                          transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Share Game</span>
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-3">
            <button
              className="text-white font-bold py-3 px-4 rounded-md w-full
                        transform transition-all duration-200 ease-in-out
                        hover:bg-[#0040D0] active:scale-[0.98]"
              style={{ backgroundColor: STYLES.colors.primary }}
              onClick={() => router.push("./paid_wait_room")}
            >
              View Waiting Room
            </button>
          </div>

          {/* Instructions */}
          <p
            className="text-sm mt-4"
            style={{ color: STYLES.colors.text.secondary }}
          >
            Share this code with players to let them join your game
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
