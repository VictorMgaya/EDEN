"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, User, Settings, Search, BarChart2, ChevronDown, MapPin, Home, ShoppingCart, ShoppingBag, BookOpen } from "react-feather"; // Add MapPin import
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for useRouter
import axios from "axios"; 


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
  const router = useRouter();

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

  // Function to request user location
  const requestUserLocation = async () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        router.push(`/analytics?lon=${longitude}&lat=${latitude}`);
        // Force a reload
      },
      (error) => {
        console.error("Error retrieving user location:", error);
      }
    );
  } else {
    alert("Geolocation is not available in your browser.");
  }
};


  return (
    <>
      <header
  className={` header py-2 md:py-6 xl:py-6 rounded-b-2xl ${
    currentTheme === "light"
      ? "text-black bg-gradient-to-r from-blue-500/90 to-green-500/90 p-6 md:p-10"
      : "text-white bg-gradient-to-r from-gray-900/95 to-green-950/95 p-6 md:p-10"
  } fixed top-0 left-0 right-0 z-10 font-primary`}
>
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl md:text-3xl font-bold-200 ">
              Eden
            </h1>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex items-center gap-4 relative">
                        <input
              type="text"
              placeholder={`S e a r c h . . . .`}
              className={`px-4 py-2 rounded-lg border ${currentTheme === "light" ? "border-black" : "border-white"} bg-${currentTheme === "light" ? "white" : "green-900"} text-${currentTheme === "light" ? "black" : "white"}`}
            
            />
            <Button type="button" className={`${currentTheme === "light" ? "bg-green-600/90" : "bg-green-950/90"}`}>
              <Search />
           </Button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-end gap-8">
            <Nav />
            <Button type="buton" ><User2Icon/></Button>
            <Button
              type="button"
              onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
              className={`ml-4 ${currentTheme === "light" ? "bg-green-500/10" : "bg-green-900/10"}`}
            >
              {currentTheme === "light" ? <Moon /> : <Sun />}
            </Button>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-start gap-4  font-primary">
            <input
              type="text"
              placeholder={`Search. . . .`}
              className={`px-4 py-2 rounded-lg border ${currentTheme === "light" ? "border-black" : "border-white"} bg-${currentTheme === "light" ? "white" : "green-900"} text-${currentTheme === "light" ? "black" : "white"}`}
            
            />
            <Button
              type="button">
              <Search />
            </Button>
            <DropdownMenu className="font-primary align-start">
              <DropdownMenuTrigger asChild>
                <Button className={`${currentTheme === "light" ? "bg-green-500" : "bg-green-900"}`}>
                  <Menu />  
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={` ${currentTheme === "light" ? "text-black bg-green-400" : "text-white bg-green-950"} font-primary`}>
                <DropdownMenuItem >
                  <Button type="button" className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}><User /></Button>Account
                </DropdownMenuItem>
                <DropdownMenuItem url="/">
                  <Button type="button" className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}><Home /></Button>Home
                </DropdownMenuItem>
                <DropdownMenuItem url="/analytics">
                  <Button type="button"  className={` px-3 py-2 rounded-lg ${currentTheme === "light" ? "bg-green-500" : "bg-green-950"}`}><BarChart2 /></Button>Analytics
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