"use client";

import React, { useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, SignOutButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="relative min-h-screen flex flex-col items-center justify-center">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {/* Cyberpunk-style grid background */}
            <div className="absolute top-0 left-0 right-0 h-full" style={{ 
              backgroundImage: `
                linear-gradient(to right, rgba(4, 255, 204, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(4, 255, 204, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-center mb-6 animate-pulse">
            Welcome to Intellecta
          </h1>
          <p className="text-xl text-aquamarine text-center max-w-2xl mx-auto mb-8 text-emerald-400/90">
            Your intelligent assistant for all needs
          </p>
          
          <div className="flex space-x-4 mb-16">
            <SignedIn>
              <SignOutButton>
                <Button 
                  variant="outline" 
                  className="text-emerald-400 border-2 border-emerald-400 bg-black hover:bg-emerald-400/20 hover:text-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                >
                  Sign Out
                </Button>
              </SignOutButton>
            </SignedIn>
            <SignedOut>
              <div className="flex space-x-4">
                <SignInButton mode="modal">
                  <Button 
                    variant="outline" 
                    className="text-emerald-400 border-2 border-emerald-400 bg-black hover:bg-emerald-400/20 hover:text-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 animate-pulse"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button 
                    className="bg-emerald-400 text-black hover:bg-emerald-300 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 font-semibold"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { title: "Fast", description: "Real-time responses with lightning-fast speed" },
              { title: "Modern", description: "Next.js 15, Tailwind CSS, Shadcn UI" },
              { title: "Smart", description: "Powered by your favorite AI models" },
            ].map(({ title, description }) => (
              <div key={title} className="p-6 bg-black/60 backdrop-blur-sm border-2 border-emerald-400/30 rounded-lg shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300">
                <h3 className="text-lg font-semibold mb-2 text-emerald-400">{title}</h3>
                <p className="text-emerald-300/80">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
