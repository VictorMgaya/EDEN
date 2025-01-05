'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and registration forms.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // For registration
  const [error, setError] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("light"); // Add this line to define currentTheme

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Token:", data.token);
        localStorage.setItem("token", data.token);
        alert("Login successful!");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful! Please log in.");
        setIsLogin(true); // Switch to login after successful registration.
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className={`w-full max-w-md p-8 bg-green-500/10 rounded-lg`}>
        <Link href="/" className="flex items-center justify-center mb-6">
          <Image src="/eden.svg" alt="Eden Logo" width={64} height={64} className="h-16 md:h-20" />
        </Link>
        <h1 className="text-2xl font-bold text-center text-green-500">
          {isLogin ? "Welcome back!" : "Create an account"}
        </h1>
        {isLogin ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg text-lg hover:bg-blue-700 transition duration-300">
              Login
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-sm text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className="text-blue-500 underline"
              >
                Register here
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-green-600 text-white p-3 rounded-lg text-lg hover:bg-green-700 transition duration-300">
              Register
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-sm text-center">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className="text-blue-500 underline"
              >
                Login here
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
