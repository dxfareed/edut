"use client";
import Image from "next/image";
import { client } from "../client";
import { ConnectButton, darkTheme } from "thirdweb/react";
import Link from "next/link";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import wallets from "./wallet";

export default function Header() {
  return (
    <>
      <div className="w-full justify-center fixed z-[9999]">
        <header className="fixed top-0 left-0 right-0 bg-blue-600 p-4 flex justify-between items-center md:px-8 lg:px-16 z-20">
          <Link href="/">
            <Image
              src="/icons/logo.png"
              alt="Logo"
              className="ml-4 md:ml-20"
              width={20}
              height={20}
            />
          </Link>
          <div className="relative group">
            <ConnectButton
              client={client}
              wallets={wallets}
              theme={darkTheme({
                colors: {
                  primaryButtonBg: "hsl(226, 100%, 48%)",
                  primaryButtonText: "hsl(0, 0%, 100%)",
                  accentButtonBg: "hsl(216, 100%, 34%)",
                  connectedButtonBg: "hsl(216, 100%, 34%)",
                  connectedButtonBgHover: "hsl(216, 85%, 38%)",
                  borderColor: "hsl(237, 100%, 18%)",
                },
              })}
              connectModal={{ size: "compact" }}
            />
          </div>
        </header>
      </div>
    </>
  );
}
