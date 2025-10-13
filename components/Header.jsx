"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, User, Settings, Search, BarChart2, ChevronDown, MapPin, Home, ShoppingCart, ShoppingBag, BookOpen, LogOut } from "react-feather";
import React, { useEffect, useState, useRef } from "react"; // Import useRef
import { useRouter, usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "./BottomNav";
import { Zap, Crown, Trophy, PanelLeft, User2Icon } from "lucide-react";




// Components
import Nav from "./Nav";



const subscriptionTiers = {
  freemium: { name: "Free", icon: Zap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20" },
  pro: { name: "Pro", icon: Crown, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20" },
  enterprise: { name: "Enterprise", icon: Trophy, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/20" }
};

const Header = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("General");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [userCredits, setUserCredits] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const searchInputRef = useRef(null); // Create a ref for the search input
  const router = useRouter();
  const { status, data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    document.body.className = theme === "system" ? resolvedTheme : theme;

    const handleOpenLocationSearch = () => {
      setIsSearchOpen(true);
      // Focus the search input when the event is triggered
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('openLocationSearch', handleOpenLocationSearch);

    return () => {
      window.removeEventListener('openLocationSearch', handleOpenLocationSearch);
    };
  }, [theme, resolvedTheme]);

  // Fetch user credits and subscription data
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
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
  }, [status, session?.user?.email]);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // Function to fetch location suggestions
  const fetchLocationSuggestions = async (query) => {
    const apiKey = "6a948d7bee3b4660a76d218767675034";
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`;
    try {
      const response = await axios.get(url);
      setLocationSuggestions(response.data.results);
    } catch (error) {
      console.error("Error fetching location suggestions:", error.response ? error.response.data : error.message);
    }
  };

  const handleLocationRequest = async () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

      if (permissionStatus.state === 'denied') {
        alert("Please enable location access in your browser settings");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Using window.location.href for direct navigation and automatic page reload
          window.location.href = `/analytics?lon=${longitude}&lat=${latitude}`;
        },
        (error) => {
          console.error("Error retrieving user location:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert("Location permission was denied");
              break;
            case error.POSITION_UNAVAILABLE:
              alert("Location information is unavailable");
              break;
            case error.TIMEOUT:
              alert("Location request timed out");
              break;
            default:
              alert("An unknown error occurred");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };


  const handleSuggestionClick = (suggestion) => {
    if (pathname === '/' || pathname === '/analytics') {
      const { lat, lng } = suggestion.geometry;
      setSearchInput(suggestion.formatted);
      setLocationSuggestions([]);

      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('lon', lng);
      searchParams.set('lat', lat);

      const newUrl = `/analytics?${searchParams.toString()}`;
      router.push(newUrl);
      window.location.href = newUrl;
    }
    else if (pathname === '/Experts') {
      // Navigate to Experts with search param
      router.push(`/Experts?name=${searchInput}`);
    }
  };

  return (
    <>
      <header
        className="header flex justify-between rounded-br-2xl bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 border-b border-blue-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 xsm:h-20 sm:h-20 md:h-16 lg:h-16 xl:h-16 fixed top-0 left-0 right-0 z-50 font-primary animate-accordion-down lazyloaded ease-in-out shadow-lg"
      >
        <meta name="google-adsense-account" content="ca-pub-9431888211578782" />
        <meta name="google-site-verification" content="xhS9AxO9_lnZW5qXS9B3tCziTO-v0E0pAv8OicFMsd4" />
        <div className="container mx-auto flex justify-between items-center">
          {/* Sidebar Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className={`hidden md:flex w-10 h-10 ${currentTheme === "light" ? "text-blue-700 hover:text-green-600" : "text-gray-300 hover:text-green-400"}`}
            onClick={(e) => {
              e.preventDefault();
              // Dispatch custom event to trigger sidebar collapse
              window.dispatchEvent(new CustomEvent('toggleSidebar'));
            }}
          >
            <PanelLeft className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl md:text-3xl font-bold-italic">
              Eden
            </h1>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex items-center gap-4 relative">
            <div className="relative">
              <input
                ref={searchInputRef} // Attach the ref to the input
                type="text"
                placeholder={pathname === '/Experts' ? 'Search Experts...' : 'Search location...'}
                value={searchInput}
                onChange={(e) => {

                  setSearchInput(e.target.value);
                  if (e.target.value.length > 2) {
                    fetchLocationSuggestions(e.target.value);
                  }
                }}
                className={`px-4 py-2 rounded-2xl border ${currentTheme === "light" ? "border-black" : "border-white"} ${currentTheme === "light" ? "bg-white" : "bg-green-900"} ${currentTheme === "light" ? "text-black" : "text-white"}`}
              />
              {locationSuggestions.length > 0 && (
                <ul className={`absolute shadow-lg rounded-b-2xl mt-1 w-80 max-h-48 ${currentTheme === "light"
                  ? "text-black bg-gradient-to-r from-blue-500/90 to-green-500/90"
                  : "text-white bg-gradient-to-r from-gray-900/95 to-green-950/95"
                  } overflow-y-auto`}>
                  {locationSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.formatted}
                      className="p-2  hover:bg-green-700 cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.formatted}
                    </li>
                  ))}
                </ul>
              )}

            </div>
            <Button
              onClick={handleLocationRequest} >
              <MapPin />
            </Button>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 font-primary">
            <Nav />

            {/* User Account Info */}
            {status === 'authenticated' ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/auth")}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session?.user.image} />
                  <AvatarFallback><User2Icon className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-24">
                    {session?.user?.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {subscriptionData && subscriptionTiers[subscriptionData] && (() => {
                      const tier = subscriptionTiers[subscriptionData];
                      const IconComponent = tier.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>
                          <IconComponent className="w-2.5 h-2.5" />
                          {tier.name}
                        </span>
                      );
                    })()}
                    {userCredits !== null && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                        <Zap className="w-2.5 h-2.5" />
                        {userCredits}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Avatar className="cursor-pointer" onClick={() => router.push("/auth")}>
                <AvatarFallback><User2Icon /></AvatarFallback>
              </Avatar>
            )}

          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-4  font-primary">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={pathname === '/Experts' ? 'Search Experts...' : 'Search location...'}
                value={searchInput}
                onChange={(e) => {

                  setSearchInput(e.target.value);
                  if (e.target.value.length > 2) {
                    fetchLocationSuggestions(e.target.value);
                  }
                }}
                className={`px-4 py-2 w-36 text-sm rounded-2xl border ${currentTheme === "light" ? "border-black" : "border-white"} ${currentTheme === "light" ? "bg-white" : "bg-green-900"} ${currentTheme === "light" ? "text-black" : "text-white"}`}
              />
              {locationSuggestions.length > 0 && (
                <ul className={`absolute shadow-lg rounded-2xl ${currentTheme === "light"
                  ? "text-black bg-gradient-to-r from-blue-500/90 to-green-500/90 sm:h-16 md:h-20 lg:h-24 xl:h-28"
                  : "text-white bg-gradient-to-r from-gray-900/95 to-green-950/95 sm:h-16 md:h-20 lg:h-24 xl:h-28"
                  } mt-2 w-36 max-h-48 overflow-y-auto `}>
                  {locationSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.formatted}
                      className="p-2 w-36   cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.formatted}
                    </li>
                  ))}
                </ul>
              )}

            </div>
            <Button
              onClick={handleLocationRequest} >
              <MapPin />
            </Button>
            {status === "authenticated" ? (
              <div onClick={(e) => {
                e.preventDefault();
                // Dispatch custom event to trigger mobile sidebar
                window.dispatchEvent(new CustomEvent('toggleMobileSidebar'));
              }}>
                <Avatar className="cursor-pointer" placeholder="Menu">
                  <AvatarImage src={session?.user.image || 'edenlogo.svg'} />
                  <AvatarFallback><User2Icon /></AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div onClick={() => router.push("/auth")}>
                <Avatar className="cursor-pointer">
                  <AvatarFallback><User2Icon /></AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Existing header code */}
      <BottomNav />
    </>

  );
};

export default Header;
