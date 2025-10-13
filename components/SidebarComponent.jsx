"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  BarChart2,
  Users,
  BookOpen,
  MapPin,
  Settings,
  LogIn,
  LogOut as LogOutIcon,
  Moon,
  Sun,
  User2Icon,
  ChevronUp,
  ChevronDown,
  Zap,
  Crown,
  Trophy,
  PanelLeft,
  X,
  Bell,
  Search,
  HelpCircle,
  MessageSquare,
  Star,
  TrendingUp,
  Award,
  Shield,
  Clock,
  CheckCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Navigation items
const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart2, badge: "Pro" },
  { title: "Experts", url: "/Experts", icon: Users },
  { title: "Services", url: "/services", icon: MapPin },
  { title: "Blog", url: "/blog", icon: BookOpen },
  { title: "About", url: "/about", icon: BookOpen },
];

const profileSectionItems = [
  { title: "Profile", url: "/auth", icon: User2Icon, altIcon: LogIn },
];

const accountSectionItems = [
  { title: "Edit Profile", url: "/auth/edit", icon: Settings },
  { title: "Account Settings", url: "/auth", icon: Settings },
];

const subscriptionTiers = {
  freemium: { name: "Free", icon: Zap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20" },
  pro: { name: "Pro", icon: Crown, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20" },
  enterprise: { name: "Enterprise", icon: Trophy, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/20" }
};

const SidebarComponent = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  const [mounted, setMounted] = useState(false);
  const [isUserSectionOpen, setIsUserSectionOpen] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Listen for sidebar toggle events from Header
    const handleToggleSidebar = () => {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    };

    const handleToggleMobileSidebar = () => {
      setIsSheetOpen(!isSheetOpen);
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    window.addEventListener('toggleMobileSidebar', handleToggleMobileSidebar);

    return () => {
      window.removeEventListener('toggleSidebar', handleToggleSidebar);
      window.removeEventListener('toggleMobileSidebar', handleToggleMobileSidebar);
    };
  }, [isDesktopCollapsed]);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isAuthenticated = status === "authenticated";

  // Fetch user credits and subscription data
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && session?.user?.email) {
        try {
          const response = await fetch('/api/users/credits/check');
          if (response.ok) {
            const data = await response.json();
            setUserCredits(data.credits);
            setSubscriptionData(data.subscription);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, session?.user?.email]);

  const isActive = useCallback((url) => pathname === url, [pathname]);
  const handleNavigation = useCallback((url, e) => {
    e.preventDefault();
    router.push(url);
    // Close mobile sheet after navigation
    if (isMobile) {
      setIsSheetOpen(false);
    }
  }, [router, isMobile]);

  const handleThemeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    console.log('Switching theme to:', newTheme);
    if (isMobile) setIsSheetOpen(false);
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await signOut({ callbackUrl: "/dashboard", redirect: false });
      if (isMobile) setIsSheetOpen(false);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Only show sidebar for authenticated users
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="flex-1 overflow-hidden min-h-screen">
          <div className="flex flex-col h-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  const sidebarContent = (
    <div className={`
      ${currentTheme === "light"
        ? "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 border-r border-blue-200/50 shadow-xl"
        : "bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 border-r border-slate-700/50 shadow-2xl"
      }
      ${isMobile ? "w-full h-full" : `${isDesktopCollapsed ? "w-16" : "w-72"} h-screen`}
      flex flex-col backdrop-blur-md
      ${isMobile ? "shadow-2xl" : ""}
      transition-all duration-300 ease-in-out
    `}>

      {/* Enhanced Header */}
      <div className={`
        ${currentTheme === "light"
          ? "bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border-b border-emerald-200/50"
          : "bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-indigo-900/20 border-b border-slate-700/50"
        }
        ${isMobile ? "px-6 py-4" : "px-4 py-3"}
        backdrop-blur-md
      `}>
        <div className={`flex items-center justify-between ${isMobile ? "gap-4" : "gap-3"}`}>
          <div className={`flex items-center ${isMobile ? "gap-4" : "gap-3"} flex-1 min-w-0`}>
            <div className="relative">
              <Avatar
                className={`
                  ${isMobile ? "w-12 h-12" : "w-10 h-10"}
                  cursor-pointer ring-2 transition-all duration-200 hover:scale-105
                  ${currentTheme === "light"
                    ? "ring-blue-200 hover:ring-blue-400"
                    : "ring-slate-600 hover:ring-slate-400"
                  }
                `}
                onClick={() => router.push("/auth")}
              >
                {isAuthenticated && session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt="User" className="object-cover" />
                ) : (
                  <AvatarFallback className={`
                    ${currentTheme === "light"
                      ? "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600"
                      : "bg-gradient-to-br from-slate-700 to-slate-600 text-slate-300"
                    }
                  `}>
                    <User2Icon className={`${isMobile ? "w-6 h-6" : "w-5 h-5"}`} />
                  </AvatarFallback>
                )}
              </Avatar>
              {isAuthenticated && (
                <div className={`
                  absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold
                  ${currentTheme === "light" ? "bg-green-500 text-white" : "bg-green-400 text-green-900"}
                `}>
                  ✓
                </div>
              )}
            </div>

            <div className={`flex flex-col overflow-hidden min-w-0 ${isDesktopCollapsed ? "flex-1 items-center justify-center" : "flex-1"}`}>
              {isAuthenticated ? (
                <div className={`${isDesktopCollapsed ? "text-center" : ""}`}>
                  {!isDesktopCollapsed && (
                    <>
                      <span className={`
                        ${isMobile ? "text-base" : "text-sm"}
                        font-bold truncate bg-gradient-to-r bg-clip-text text-transparent
                        ${currentTheme === "light"
                          ? "from-blue-600 to-indigo-600"
                          : "from-blue-400 to-indigo-400"
                        }
                      `}>
                        {session?.user?.name || "User"}
                      </span>
                      <div className={`flex items-center gap-2 ${isMobile ? "mt-1.5" : "mt-1"} flex-wrap`}>
                        {subscriptionData && subscriptionTiers[subscriptionData] && (() => {
                          const tier = subscriptionTiers[subscriptionData];
                          const IconComponent = tier.icon;
                          return (
                            <Badge variant="secondary" className={`
                              ${isMobile ? "text-xs px-2 py-1" : "text-[10px] px-1.5 py-0.5"}
                              ${tier.bg} ${tier.color} border-0 font-semibold
                            `}>
                              <IconComponent className={`${isMobile ? "w-3 h-3" : "w-2.5 h-2.5"} mr-1`} />
                              {tier.name}
                            </Badge>
                          );
                        })()}
                        {userCredits !== null && (
                          <Badge className={`
                            ${isMobile ? "text-xs px-2 py-1" : "text-[10px] px-1.5 py-0.5"}
                            bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 border-0 font-bold
                          `}>
                            <Zap className={`${isMobile ? "w-3 h-3" : "w-2.5 h-2.5"} mr-1`} />
                            {userCredits}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                  {isDesktopCollapsed && (
                    <div className="text-xs font-bold text-center">
                      <div className={`
                        bg-gradient-to-r bg-clip-text text-transparent
                        ${currentTheme === "light"
                          ? "from-blue-600 to-indigo-600"
                          : "from-blue-400 to-indigo-400"
                        }
                      `}>
                        {session?.user?.name?.charAt(0) || "U"}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`
                  ${isMobile ? "text-base" : "text-sm"}
                  font-bold bg-gradient-to-r bg-clip-text text-transparent text-center
                  ${currentTheme === "light"
                    ? "from-gray-600 to-gray-500"
                    : "from-gray-400 to-gray-300"
                  }
                `}>
                  {!isDesktopCollapsed ? "Welcome to Eden" : "EDEN"}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Collapse Button */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className={`
                w-8 h-8 rounded-full transition-all duration-200 hover:scale-110
                ${currentTheme === "light"
                  ? "hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700"
                  : "hover:bg-slate-700 text-slate-300 hover:text-slate-200"
                }
              `}
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            >
              <PanelLeft className={`w-4 h-4 transition-transform duration-200 ${isDesktopCollapsed ? "rotate-180" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className={`flex flex-col justify-between flex-1 overflow-hidden ${isMobile ? "py-6 px-4" : "py-4 px-3"}`}>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* Main Navigation */}
          <div className="space-y-2 mb-6">
            {!isDesktopCollapsed && (
              <div className={`
                ${isMobile ? "px-3 py-2" : "px-2 py-1.5"}
                ${currentTheme === "light" ? "text-gray-600" : "text-gray-400"}
                text-xs font-semibold uppercase tracking-wider
              `}>
                Navigation
              </div>
            )}
            {navigationItems.map((item, index) => (
              <div
                key={item.title}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <a
                  href={item.url}
                  onClick={(e) => handleNavigation(item.url, e)}
                  className={`
                    group flex items-center ${isDesktopCollapsed ? "justify-center" : "justify-between"}
                    ${isMobile ? "gap-4 px-4 py-3" : isDesktopCollapsed ? "px-2 py-3" : "gap-3 px-3 py-2.5"}
                    rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md
                    ${isMobile ? "text-base" : "text-sm"}
                    font-medium
                    ${isActive(item.url)
                      ? currentTheme === "light"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25"
                      : currentTheme === "light"
                        ? "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        : "text-gray-300 hover:bg-slate-800/50 hover:text-blue-400"
                    }
                  `}
                  title={isDesktopCollapsed ? item.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${isActive(item.url)
                        ? "bg-white/20"
                        : "bg-gray-100 dark:bg-slate-700"
                      }
                    `}>
                      <item.icon className={`
                        ${isMobile ? "w-5 h-5" : "w-4 h-4"}
                        ${isActive(item.url) ? "text-white" : ""}
                      `} />
                    </div>
                    {!isDesktopCollapsed && <span className="font-medium">{item.title}</span>}
                  </div>
                  {item.badge && !isDesktopCollapsed && (
                    <Badge className={`
                      ${isMobile ? "text-xs px-2 py-1" : "text-[10px] px-1.5 py-0.5"}
                      bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 font-bold
                      animate-pulse
                    `}>
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </div>
            ))}
          </div>

          <Separator className={`my-4 ${currentTheme === "light" ? "bg-blue-200/50" : "bg-slate-700/50"}`} />

          {/* Quick Actions */}
          <div className="space-y-2 mb-6">
            {!isDesktopCollapsed && (
              <div className={`
                ${isMobile ? "px-3 py-2" : "px-2 py-1.5"}
                ${currentTheme === "light" ? "text-gray-600" : "text-gray-400"}
                text-xs font-semibold uppercase tracking-wider
              `}>
                Quick Actions
              </div>
            )}
            <div className={`${isDesktopCollapsed ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
              <Button
                variant="ghost"
                className={`
                  ${isMobile ? "p-3 h-auto" : "p-2 h-auto"}
                  flex ${isDesktopCollapsed ? "flex-row items-center justify-center" : "flex-col items-center"}
                  ${isDesktopCollapsed ? "gap-2" : "gap-2"}
                  rounded-xl transition-all duration-200 hover:scale-105
                  ${currentTheme === "light"
                    ? "hover:bg-blue-50 text-blue-700"
                    : "hover:bg-slate-800 text-slate-300"
                  }
                `}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/analytics");
                  if (isMobile) setIsSheetOpen(false);
                }}
                title={isDesktopCollapsed ? "Analytics" : undefined}
              >
                <TrendingUp className={`${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
                {!isDesktopCollapsed && <span className={`${isMobile ? "text-xs" : "text-[10px]"}`}>Analytics</span>}
              </Button>
              <Button
                variant="ghost"
                className={`
                  ${isMobile ? "p-3 h-auto" : "p-2 h-auto"}
                  flex ${isDesktopCollapsed ? "flex-row items-center justify-center" : "flex-col items-center"}
                  ${isDesktopCollapsed ? "gap-2" : "gap-2"}
                  rounded-xl transition-all duration-200 hover:scale-105
                  ${currentTheme === "light"
                    ? "hover:bg-green-50 text-green-700"
                    : "hover:bg-slate-800 text-slate-300"
                  }
                `}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/services");
                  if (isMobile) setIsSheetOpen(false);
                }}
                title={isDesktopCollapsed ? "Services" : undefined}
              >
                <MapPin className={`${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
                {!isDesktopCollapsed && <span className={`${isMobile ? "text-xs" : "text-[10px]"}`}>Services</span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className={`
          ${currentTheme === "light"
            ? "bg-gradient-to-r from-gray-50/50 to-blue-50/50 border-t border-blue-200/30"
            : "bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-t border-slate-700/30"
          }
          ${isMobile ? "p-4" : "p-3"}
          backdrop-blur-sm
        `}>
          <div className="space-y-3">
            {/* Theme Toggle */}
            <Button
              onClick={handleThemeToggle}
              variant="ghost"
              className={`
                w-full flex items-center ${isDesktopCollapsed ? "justify-center" : "justify-center"}
                ${isMobile ? "gap-3 px-4 py-3" : isDesktopCollapsed ? "px-2 py-3" : "gap-2 px-3 py-2"}
                rounded-xl transition-all duration-200 hover:scale-[1.02]
                ${currentTheme === "light"
                  ? "hover:bg-blue-50 text-blue-700"
                  : "hover:bg-slate-800 text-slate-300"
                }
              `}
              title={isDesktopCollapsed ? (currentTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode") : undefined}
            >
              {currentTheme === "light" ? (
                <>
                  <Moon className={`${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
                  {!isDesktopCollapsed && <span className="font-medium">Dark Mode</span>}
                </>
              ) : (
                <>
                  <Sun className={`${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
                  {!isDesktopCollapsed && <span className="font-medium">Light Mode</span>}
                </>
              )}
            </Button>

            {/* Sign Out Button */}
            {isAuthenticated && (
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className={`
                  w-full flex items-center ${isDesktopCollapsed ? "justify-center" : ""}
                  ${isMobile ? "gap-3 px-4 py-3" : isDesktopCollapsed ? "px-2 py-3" : "gap-2 px-3 py-2"}
                  rounded-xl transition-all duration-200 hover:scale-[1.02]
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                `}
                title={isDesktopCollapsed ? "Sign Out" : undefined}
              >
                <LogOutIcon className={`${isMobile ? "w-5 h-5" : "w-4 h-4"}`} />
                {!isDesktopCollapsed && <span className="font-medium">Sign Out</span>}
              </Button>
            )}

            {/* Footer Info */}
            {!isDesktopCollapsed && (
              <div className={`
                ${isMobile ? "pt-3" : "pt-2"}
                ${currentTheme === "light" ? "border-t border-blue-200/30" : "border-t border-slate-700/30"}
              `}>
                <div className={`
                  ${isMobile ? "text-xs" : "text-[10px]"}
                  ${currentTheme === "light" ? "text-gray-500" : "text-gray-400"}
                  text-center
                `}>
                  Eden v2.0 • Resource Analysis Engine
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 md:hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-800"
              onClick={(e) => {
                e.preventDefault();
                setIsSheetOpen(true);
              }}
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-80 border-0 shadow-2xl [&>button]:hidden"
            onInteractOutside={(e) => {
              // Prevent closing when clicking inside
              e.preventDefault();
            }}
          >
            <div className="relative h-full">
              {/* Custom Close button for shadcn Sheet */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 w-8 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
              {sidebarContent}
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden min-h-screen">
          <div className="flex flex-col h-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full relative">
      <div className="fixed left-0 top-0 z-40 h-screen">
        {sidebarContent}
      </div>
      <div className={`flex-1 overflow-hidden min-h-screen ${isDesktopCollapsed ? "" : "ml-72"} transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarComponent;
