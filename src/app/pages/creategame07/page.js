"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Share2, Copy, Check } from "lucide-react";

const WalletModal = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [quizCode, setQuizCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedQuizCode = sessionStorage.getItem("inviteCode");
      setQuizCode(storedQuizCode);
      setShareSupported(!!navigator.share);
      setShareUrl(`${window.location.origin}/pages/join_game`);
    }
  }, []);

  const shareMessage = `Join my quiz game! Use code: ${quizCode}\n`;

  const handleCopyCode = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-4 text-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-96 transform relative">
              <header className="bg-blue-600 p-2 flex justify-between items-center md:px-8 lg:px-16 rounded-t-lg absolute left-0 right-0 top-0"></header>

              <div className="bg-white rounded-t-lg p-4 mb-4 flex items-center justify-center">
                <Image
                  src="/icons/credit.png"
                  alt="Credit Icon"
                  width={25}
                  height={19}
                  className="bg-[#EDEBFF]"
                />
              </div>

              <h2 className="text-2xl font-semibold text-center mb-4">
                Game is all set up
              </h2>

              {/* Game Code Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-600 text-sm mb-2">Game Code:</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {quizCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Share Section */}
              <div className="space-y-4 mb-6">
                <button
                  onClick={handleShare}
                  className={`flex items-center justify-center space-x-2 w-full py-3 px-4 
                            rounded-md border border-gray-200 hover:bg-gray-50 
                            transition-colors ${
                              !shareSupported ? "hidden" : ""
                            }`}
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Game</span>
                </button>
              </div>

              {/* Action Button */}
              <div className="space-y-3">
                <button
                  className="bg-[#004EF3] text-white font-bold py-3 px-4 rounded-md w-full
                            transform transition-all duration-200 ease-in-out
                            hover:bg-[#0040D0] active:scale-[0.98]"
                  onClick={() => router.push("./host_wait_room")}
                >
                  View Waiting Room
                </button>
              </div>

              {/* Share Instructions */}
              <p className="text-sm text-gray-500 mt-4">
                Share this code with players to let them join your game
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletModal;
