"use client";
import Header from "@/components/Header";
import { Authenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { NavigationProvider, useNavigation } from "@/lib/NavigationProvider";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { MessageSquare, PlusCircle } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen, toggleSidebar, currentPage, setCurrentPage, currentChatId, setCurrentChatId } = useNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Update the current page based on the pathname
    switch (pathname) {
      case "/dashboard":
        setCurrentPage("My Dashboard");
        break;
      case "/dashboard/chat":
        setCurrentPage("Chat");
        break;
      case "/dashboard/history":
        setCurrentPage("Chat History");
        break;
      default:
        setCurrentPage("My Dashboard");
    }

    // Update current chat ID if in chat page
    if (pathname === "/dashboard/chat") {
      const chatId = searchParams.get("chatId");
      setCurrentChatId(chatId);
    } else {
      setCurrentChatId(null);
    }
  }, [pathname, searchParams, setCurrentPage, setCurrentChatId]);

  const buttonClasses = `
    w-full 
    justify-start 
    text-white 
    hover:bg-gradient-to-r 
    hover:from-blue-400
    hover:to-cyan-400
    hover:shadow-lg
    hover:shadow-cyan-500/50
    transition-all 
    duration-300
    rounded-md
    relative
    overflow-hidden
    hover:scale-105
    hover:font-semibold
  `;

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0
          h-full
          bg-gray-900 
          text-white 
          w-64
          transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform
          duration-300 
          ease-in-out
          z-50
        `}
      >
        <div className="p-4 w-64">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold"></span>
          </div>
          <nav className="space-y-4">
            <Link href="/dashboard" onClick={() => setCurrentPage("My Dashboard")}>
              <Button
                variant="ghost"
                className={`${buttonClasses} ${pathname === "/dashboard" ? "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-cyan-500/50 font-semibold" : ""}`}
              >
                Home
              </Button>
            </Link>
            <Link href="/dashboard/chat" onClick={() => setCurrentPage("New Chat")}>
              <Button
                variant="ghost"
                className={`${buttonClasses} ${pathname === "/dashboard/chat" && !currentChatId ? "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-cyan-500/50 font-semibold" : ""}`}
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                New Chat
              </Button>
            </Link>
            {currentChatId && (
              <Link href={`/dashboard/chat?chatId=${currentChatId}`} onClick={() => setCurrentPage("Current Chat")}>
                <Button
                  variant="ghost"
                  className={`${buttonClasses} ${pathname === "/dashboard/chat" && currentChatId ? "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-cyan-500/50 font-semibold" : ""}`}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Current Chat
                </Button>
              </Link>
            )}
            <Link href="/dashboard/history" onClick={() => setCurrentPage("Chat History")}>
              <Button
                variant="ghost"
                className={`${buttonClasses} ${pathname === "/dashboard/history" ? "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-cyan-500/50 font-semibold" : ""}`}
              >
                Chat History
              </Button>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        flex-1 
        flex 
        flex-col 
        w-full
        transform
        transition-all
        duration-300
        ease-in-out
        ${isSidebarOpen ? 'pl-64' : 'pl-0'}
      `}>
        <Header onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} currentPage={currentPage} />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <DashboardContent>{children}</DashboardContent>
    </NavigationProvider>
  );
}
