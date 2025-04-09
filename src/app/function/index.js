const { onValueWritten } = require("firebase-functions/v2/database");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.handleQuizCompletion = onValueWritten(
  "paid_quizzes/{quizCode}/current_question",
  async (event) => {
    try {
      // Get the new value of current_question
      const currentQuestion = event.data.after.val();
      const quizCode = event.params.quizCode;

      // Only proceed if current_question is 100
      if (currentQuestion !== 100) {
        return null;
      }

      logger.log(`Quiz ${quizCode} completed. Finding top 3 scorers...`);

      // Fetch participants for the quiz
      const participantsRef = admin
        .database()
        .ref(`game_participant/${quizCode}`);
      const snapshot = await participantsRef.once("value");

      if (!snapshot.exists()) {
        logger.log(`No participants found for quizCode: ${quizCode}`);
        return null;
      }

      const participantsData = snapshot.val();
      const participantsArray = Object.entries(participantsData).map(
        ([username, info]) => ({
          name: username,
          score: info.score || 0,
          walletAddress: info.walletAddress || null,
        })
      );

      // Sort participants by score in descending order and get top 3
      const topThreeParticipants = participantsArray
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      logger.log(`Top 3 participants found:`, topThreeParticipants);

      // Save to Firestore
      const firestoreDoc = {
        quizCode,
        winners: topThreeParticipants.map((participant, index) => ({
          rank: index + 1,
          name: participant.name,
          score: participant.score,
          walletAddress: participant.walletAddress,
        })),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      //tweak sc, test area

      let walletAdrress;
      for (let i = 0; i < topThreeParticipants; i++) {
        walletAdrress = topThreeParticipants[i].walletAddress; // not tested yet
      }

      const sendRewards = async (address) => {
        const contract = new web3.eth.Contract(TriviaMainABI, CreateTrivia);
        const tx = contract.methods.sndRewards(address);
        const txData = tx.encodeABI();
        const privateKey =
          "0x2998124d4cf72b00e637d7e3bc45564c6a4706e7389b019d9d4501e1de570560";
        if (!privateKey) {
          console.error("Enter private in environment variable");
        }
        const fromAddress = await web3.eth.accounts.privateKeyToAccount(
          privateKey
        ).address;
        const txObject = {
          from: fromAddress,
          to: exprtNewContract,
          data: txData,
        };
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await web3.eth.estimateGas(txObject);
        const nonce = await web3.eth.getTransactionCount(fromAddress);
        //@ts-ignore
        txObject.gas = gasEstimate;
        //@ts-ignore
        txObject.gasPrice = gasPrice;
        //@ts-ignore
        txObject.nonce = nonce;
        try {
          const signedTx = await web3.eth.accounts.signTransaction(
            txObject,
            privateKey
          );
          const receipt = await web3.eth.sendSignedTransaction(
            signedTx.rawTransaction
          );
          console.log(receipt, "show contract address", exprtNewContract);
        } catch (err) {
          console.log("err testing", err);
        }
      };
      sendRewards(walletAdrress);
      await admin
        .firestore()
        .collection("quiz_winners")
        .doc(quizCode)
        .set(firestoreDoc);

      logger.log(
        `Successfully saved top 3 winners data to Firestore for quiz: ${quizCode}`
      );
      return null;
    } catch (error) {
      logger.error("Error in handleQuizCompletion:", error);
      throw error;
    }
  }
);
