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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-blue-200 dark:border-gray-700 h-16 flex items-center justify-around rounded-t-2xl z-50 shadow-lg">
            <Link href="/" className={`flex flex-col items-center ${pathname === "/" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                } capitalize font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-all`}>
                <Home size={24} />
                <span className="text-xs mt-1">Home</span>
            </Link>

            <Link href="/analytics" className={`flex flex-col items-center ${pathname === "/analytics" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                } capitalize font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-all`}>
                <BarChart2 size={24} />
                <span className="text-xs mt-1">Analytics</span>
            </Link>

            <Link href="/Experts" className={`flex flex-col items-center ${pathname === "/Experts" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                } capitalize font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-all`}>
                <BookOpen size={24} />
                <span className="text-xs mt-1">Experts</span>
            </Link>
        </nav>
    );
};

export default BottomNav;
