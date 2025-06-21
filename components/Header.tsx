import { UserButton } from "@clerk/nextjs"
import { Button } from "./ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  currentPage: string;
}

function Header({ onMenuClick, isSidebarOpen, currentPage }: HeaderProps) {
  return (
    <header className={`
      bg-gray-800 
      text-white 
      p-4
      sticky 
      top-0 
      z-40
      transition-all
      duration-300
      ease-in-out
    `}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-full"
          >
            <HamburgerMenuIcon className="w-6 h-6" />
          </Button>
          <span className="text-2xl font-bold">{currentPage}</span>
        </div>

        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}

export default Header;