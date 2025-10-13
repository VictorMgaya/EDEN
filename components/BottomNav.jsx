"use client";

import { Home, BarChart2, Briefcase } from "react-feather";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";

const BottomNav = () => {
    const router = useRouter();
    const pathname = usePathname();

    // Navigation configuration
    const navItems = useMemo(() => [
        {
            href: "/",
            icon: Home,
            label: "Home",
            ariaLabel: "Go to home page"
        },
        {
            href: "/analytics",
            icon: BarChart2,
            label: "Analytics",
            ariaLabel: "View analytics dashboard"
        },
        {
            href: "/Experts",
            icon: Briefcase,
            label: "Experts",
            ariaLabel: "Browse expert information"
        }
    ], []);

    // Optimized navigation handler using useCallback for performance
    const handleNavigation = useCallback((href) => {
        router.push(href);
    }, [router]);

    // Base classes for nav items
    const baseClasses = "flex flex-col items-center capitalize font-medium transition-all duration-200 ease-in-out cursor-pointer select-none";
    const activeClasses = "text-blue-600 dark:text-blue-400";
    const inactiveClasses = "text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300";

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-blue-200 dark:border-gray-700 h-16 flex items-center justify-around rounded-t-2xl z-100 shadow-lg"
            role="navigation"
            aria-label="Bottom navigation"
        >
            {navItems.map(({ href, icon: Icon, label, ariaLabel }) => {
                const isActive = pathname === href;

                return (
                    <button
                        key={href}
                        onClick={() => handleNavigation(href)}
                        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                        aria-label={ariaLabel}
                        aria-current={isActive ? "page" : undefined}
                        type="button"
                    >
                        <Icon
                            size={24}
                            aria-hidden="true"
                        />
                        <span className="text-xs mt-1">
                            {label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
