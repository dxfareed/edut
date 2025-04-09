"use client";
import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { MockUSDC } from "@/sc/ca";
import tokenabi from "@/sc/tokenabi.json";
import TriviaABI from "@/sc/trivia.json";
import { useRouter } from "next/navigation";
import {
  ref,
  database,
  get,
  push,
  update as firebaseUpdate,
  getDatabase,
} from "@/config/FirebaseConfig";
import { ethers } from "ethers";

const WinningPage = () => {
  const router = useRouter();
  const account = useActiveAccount();
  const [amount, setAmount] = useState(null);
  // Use the RPC endpoint for reading data
  const RPC_PROVIDER_URL = "https://rpc.open-campus-codex.gelato.digital";
  // dec constant for USDC decimals (6)
  const dec = 10 ** 6;
  const [isChecking, setIsChecking] = useState(false);
  const [pendingButtonTrnx, setPendingButtonTrnx] = useState(false);
  const [rewardStatus, setRewardStatus] = useState("initial");
  let successTrnx, balNum = null;
  const [quizCode, setQuizCode] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);

  // Fetch quiz code from Firebase
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

  // Create trivia contract via backend endpoint
  const createTrivia = async () => {
    setPendingButtonTrnx(true);
    try {
      const CREATE_CONTRACT_ENDPOINT = process.env.NEXT_PUBLIC_CREATE_TRIVIA_CONTRACT;
      if (!CREATE_CONTRACT_ENDPOINT) {
        console.log("Endpoint not found");
        return;
      }
      const response = await fetch(CREATE_CONTRACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data.newContractTriviaBase;
    } catch (err) {
      console.error(err);
      return err;
    }
  };

  // Transfer USDC using ethers.js
  const transferConfirm = async (contractAddress, _amount) => {
    if (!contractAddress) {
      console.error("Contract not found");
      return;
    }
    console.log("About to transfer tokens...");
    // Get the injected provider (e.g. MetaMask)
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    console.log(`https://edu-chain-testnet.blockscout.com/address/${contractAddress}`);
    // Instantiate token contract with signer for write access
    const tokenContract = new ethers.Contract(MockUSDC, tokenabi, signer);
    try {
      // Convert _amount to BigNumber with proper decimals
      const amountBN = ethers.BigNumber.from(_amount).mul(dec);
      const tx = await tokenContract.transfer(contractAddress, amountBN);
      console.log("Transfer transaction hash:", tx.hash);
      await tx.wait();
      console.log("Transfer confirmed");
    } catch (e) {
      console.error("Error in transferConfirm:", e);
    }
  };

  // Check contract balance using ethers.js (read-only)
  const BalanceCheck = async (contractAddress) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER_URL);
      console.log("Checking contract balance...");
      const triviaContract = new ethers.Contract(contractAddress, TriviaABI, provider);
      const r = await triviaContract.ReturnContractBalnc();
      balNum = Number(r) / dec;
      console.log("Contract balance:", balNum);
    } catch (e) {
      console.log("Failed to fetch contract balance:", e);
    }
  };

  const onApproveClick = async (_amount) => {
    const NEW_CONTRACT_TRIVIA = await createTrivia();
    console.log(`Admin confirm contract created: ${NEW_CONTRACT_TRIVIA}`);

    if (NEW_CONTRACT_TRIVIA) {
      setIsChecking(true);
      // Transfer tokens to the newly created contract
      await transferConfirm(NEW_CONTRACT_TRIVIA, _amount);
      await BalanceCheck(NEW_CONTRACT_TRIVIA);

      // Check if the contract balance is above threshold (e.g. >= 1 USDC)
      if (balNum >= 1) {
        setRewardStatus("success");
        setPendingButtonTrnx(false);
        setIsChecking(false);

        // Log payment details to Firebase
        const paymentDetails = {
          quizCode,
          timestamp: new Date().toISOString(),
          transactionDetails: {
            from: account.address,
            to: NEW_CONTRACT_TRIVIA,
            amount: _amount,
            token: "TRIB USDC",
            chainId: 656476,
            network: "Base Sepolia",
          },
          status: "completed",
        };

        const quizRef = ref(database, `quiz_staking/${quizCode}`);
        const quizcontractRef = ref(database, `paid_quizzes/${quizCode}/smartContract`);

        await firebaseUpdate(quizRef, paymentDetails);
        await firebaseUpdate(quizcontractRef, paymentDetails);

        console.log("Payment details logged:", paymentDetails);
        setIsChecking(false);
        router.push(`./paid_quizcode`);
      } else {
        setRewardStatus("failed");
        console.log("Contract balance insufficient, transaction failed");
      }
    } else {
      setRewardStatus("failed");
      console.log("Contract was never created!");
    }
  };

  return (
    <>
      {account && (
        <div className="bg-gray-100 min-h-screen flex flex-col">
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
          <div className="flex flex-col items-center justify-center flex-grow pt-47">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-96">
              <div className="bg-[#EDEBFF] rounded-t-lg p-4 mb-4 flex items-center justify-center">
                <Image src="/icons/paid.s.png" alt="Email Icon" width={19} height={12} />
              </div>
              <h2 className="text-2xl font-semibold text-center mb-4 text-reward">
                {rewardStatus === "initial" && <div>Set a Reward</div>}
                {rewardStatus === "failed" && (
                  <div className="text-red-500">Transaction Failed</div>
                )}
                {rewardStatus === "success" && (
                  <div className="text-green-500">Successful Transaction</div>
                )}
              </h2>
              <p className="text-gray-700 text-center mb-6 text-reward">
                Reward goes to the winner of the game (USDC)
              </p>
              <input
                type="text"
                pattern="[0-9]*\.?[0-9]*"
                placeholder="Enter amount in USDC"
                className="bg-white p-3 rounded-md w-full mb-4 border border-gray-300"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => onApproveClick(amount)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {pendingButtonTrnx ? "Processing..." : "Stake"}
                  </button>
                  {isChecking && (
                    <div className="mt-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Confirming payment...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WinningPage;
