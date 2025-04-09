"use client";
import { inAppWallet, createWallet } from "thirdweb/wallets";

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email", "telegram", "farcaster", "x", "guest"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
  createWallet("com.trustwallet.app"),
  createWallet("com.okex.wallet"),
  createWallet("com.bitget.web3"),
  createWallet("io.rabby"),
];

export default wallets;
