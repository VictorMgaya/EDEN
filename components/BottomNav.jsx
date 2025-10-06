"use client";

import { Home, BarChart2, BookOpen } from "react-feather";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const BottomNav = () => {
    const pathname = usePathname();
    const { theme, resolvedTheme } = useTheme();
    const currentTheme = theme === "system" ? resolvedTheme : theme;

    return (
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${currentTheme === "light"
            ? "bg-gradient-to-r from-blue-500/90 to-green-500/90"
            : "bg-gradient-to-r from-gray-900/95 to-green-950/95"
            } h-16 flex items-center justify-around rounded-t-2xl z-50`}>
            <Link href="/" className={`flex flex-col items-center ${pathname === "/" ? "text-green-500 border-b-2 border-green-500" : ""
                } capitalize font-medium hover:text-green-600 translation-all`}>
                <Home size={24} />
                <span className="text-xs mt-1">Home</span>
            </Link>

            <Link href="/analytics" className={`flex flex-col items-center ${pathname === "/analytics" ? "text-green-500 border-b-2 border-green-500" : ""
                } capitalize font-medium hover:text-green-600 translation-all`}>
                <BarChart2 size={24} />
                <span className="text-xs mt-1">Analytics</span>
            </Link>

            <Link href="/Experts" className={`flex flex-col items-center ${pathname === "/Experts" ? "text-green-500 border-b-2 border-green-500" : ""
                } capitalize font-medium hover:text-green-600 translation-all `}>
                <BookOpen size={24} />
                <span className="text-xs mt-1">Experts</span>
            </Link>
        </nav>
    );
};

export default BottomNav;
