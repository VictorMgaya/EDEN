"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, User, Settings, Search, BarChart2, ChevronDown, MapPin, Home, ShoppingCart, ShoppingBag, BookOpen } from "react-feather"; // Add MapPin import
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"




// Components
import Nav from "./Nav";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User2Icon } from "lucide-react";

const Header = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("General");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();
  const { status, data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    document.body.className = theme === "system" ? resolvedTheme : theme;
  }, [theme, resolvedTheme]);

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

      const newUrl = `${currentPath}?${searchParams.toString()}`;
      router.push(newUrl);
      window.location.href = newUrl;
    }
    else if (pathname === '/crops') {
      // Navigate to crops with search param
      router.push(`/crops?name=${searchInput}`);
    }
  };

  return (
    <>
      <header
        className={`header py-4 flex items-center justify-between flex-auto rounded-b-2xl ${currentTheme === "light"
          ? "text-black bg-gradient-to-r from-blue-500/90 to-green-500/90 sm:h-16 md:h-20 lg:h-24 xl:h-28"
          : "text-white bg-gradient-to-r from-gray-900/95 to-green-950/95 sm:h-16 md:h-20 lg:h-24 xl:h-28"
          } fixed top-0 left-0 right-0 z-50 font-primary animate-accordion-down lazyloaded ease-in-out`}
      >
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-54BWW075M3"></script>
        <script>
          {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments)}
      gtag('js', new Date());

      gtag('config', 'G-54BWW075M3');
      `}
        </script>
        <meta name="google-adsense-account" content="ca-pub-9431888211578782" />
        <meta name="google-site-verification" content="xhS9AxO9_lnZW5qXS9B3tCziTO-v0E0pAv8OicFMsd4" />
        <div className="container mx-auto flex justify-between items-center">
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
                type="text"
                placeholder={pathname === '/crops' ? 'Search crops...' : 'Search location...'}
                value={searchInput}
                onChange={(e) => {

                  setSearchInput(e.target.value);
                  if (e.target.value.length > 2) {
                    fetchLocationSuggestions(e.target.value);
                  }
                }}
                className={`px-4 py-2 rounded-2xl border ${currentTheme === "light" ? "border-black" : "border-white"} bg-${currentTheme === "light" ? "white" : "green-900"} text-${currentTheme === "light" ? "black" : "white"}`}
              />
              {locationSuggestions.length > 0 && (
                <ul className={`absolute shadow-lg rounded-b-2xl mt-1 w-80 max-h-48 ${currentTheme === " light"
                  ? "text-black bg-gradient-to-r from-blue-500/90 to-green-500/90 sm:h-16 md:h-20 lg:h-24 xl:h-28"
                  : "text-white bg-gradient-to-r from-gray-900/95 to-green-950/95 sm:h-16 md:h-20 lg:h-24 xl:h-28"
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
          <div className="hidden md:flex items-center gap-8 font-primary">
            <Nav />

            <Avatar className="cursor-pointer" onClick={() => router.push("/auth")}>
              {status === 'authenticated' ? (
                <AvatarImage src={session?.user.image} />
              ) : (
                <AvatarFallback ><User2Icon /></AvatarFallback>
              )}
            </Avatar>

            <Button
              type="button"
              onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
              className={`ml-4 ${currentTheme === "light" ? "bg-green-500/10" : "bg-green-900/10"} justify-center`}
            >
              {currentTheme === "light" ? <Moon /> : <Sun />}
            </Button>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-4  font-primary">
            <div className="relative">
              <input
                type="text"
                placeholder={pathname === '/crops' ? 'Search crops...' : 'Search location...'}
                value={searchInput}
                onChange={(e) => {

                  setSearchInput(e.target.value);
                  if (e.target.value.length > 2) {
                    fetchLocationSuggestions(e.target.value);
                  }
                }}
                className={`px-4 py-2 w-36 rounded-2xl border ${currentTheme === "light" ? "border-black" : "border-white"} bg-${currentTheme === "light" ? "white" : "green-900"} text-${currentTheme === "light" ? "black" : "white"}`}
              />
              {locationSuggestions.length > 0 && (
                <ul className={`absolute shadow-lg rounded-2xl ${currentTheme === " light"
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
            <DropdownMenu className="font-primary align-start z-50">
              <DropdownMenuTrigger asChild>
                <Button className={`${currentTheme === "light" ? "bg-green-500" : "bg-green-900"} px-3 py-3`}>
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={` ${currentTheme === "light" ? "text-black bg-green-400" : "text-white bg-green-950"} font-primary`}>
                <DropdownMenuItem>
                  {status === "authenticated" ? (
                    <Link href="/auth" className="flex items-center gap-2">
                      <Avatar className="cursor-pointer">
                        <AvatarImage src={session?.user.image} />
                      </Avatar>
                      <span>My Account</span>
                    </Link>
                  ) : (
                    <Link href="/auth" className="flex items-center gap-2">
                      <Avatar className="cursor-pointer">
                        <AvatarFallback>
                          <User2Icon />
                        </AvatarFallback>
                      </Avatar>
                      <span>Login</span>
                    </Link>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem url="/">
                  <Button type="button" className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}><Home /></Button>Home
                </DropdownMenuItem>
                <DropdownMenuItem url="/analytics">
                  <Button type="button" className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}><BarChart2 /></Button>Analytics
                </DropdownMenuItem>
                <DropdownMenuItem url="/market">
                  <Button type="button" className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}><ShoppingCart /></Button>Market
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  setTheme(currentTheme === "light" ? "dark" : "light");
                }}
                  className={`${currentTheme === "light" ? "bg-green-950/10" : "bg-green-500/10"}`}>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setTheme(currentTheme === "light" ? "dark" : "light");
                    }}
                    className={`${currentTheme === "light" ? "bg-green-950/10" : "bg-green-500/10"}`}
                  >
                    {currentTheme === "light" ? <Moon /> : <Sun />}
                  </Button>Change Theme
                </DropdownMenuItem>
                <DropdownMenuItem url="/settings">
                  <button type="button" className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}>
                    <Settings />
                  </button>Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
// Add this function inside the Header component
const handleSuggestionClick = (suggestion) => {
  console.log("Selected location coordinates:", suggestion.geometry);
  const { lat, lng } = suggestion.geometry;
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('lon', lng);
  searchParams.set('lat', lat);

  // Log the final URL to verify
  console.log(`Navigating to: ${currentPath}?${searchParams.toString()}`);
  router.push(`${currentPath}?${searchParams.toString()}`);
};

const handleSearch = () => {
  const currentPath = window.location.pathname;

  if (currentPath === '/analytics' || currentPath === '/') {
    // Location search behavior
    if (searchInput.length > 2) {
      fetchLocationSuggestions(searchInput);
    }
  } else if (currentPath === '/crops') {
    // Crop name search behavior
    // Add crop search logic here targeting h2 elements
    const cropHeadings = document.querySelectorAll('.crop-container h2');
    const searchTerm = searchInput.toLowerCase();

    cropHeadings.forEach(heading => {
      const cropName = heading.textContent.toLowerCase();
      const cropContainer = heading.closest('.crop-container');

      if (cropName.includes(searchTerm)) {
        cropContainer.style.display = 'block';
      } else {
        cropContainer.style.display = 'none';
      }
    });
  }
};
