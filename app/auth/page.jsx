"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // For registration
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const route = isLogin ? "/api/login" : "/api/register";
    const payload = { email, password, ...(isLogin ? {} : { confirmPassword }) };

    try {
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert(isLogin ? "Login successful!" : "Registration successful! Please log in.");
        if (!isLogin) setIsLogin(true); // Switch to login after registration
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-md p-8 bg-green-500/10 rounded-lg">
        <Link href="/" className="flex items-center justify-center mb-6">
          <Image src="/eden.svg" alt="Eden Logo" width={64} height={64} className="h-16 md:h-20" />
        </Link>
        <h1 className="text-2xl font-bold text-center text-green-500">
          {isLogin ? "Welcome back!" : "Create an account"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
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
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-lg text-lg hover:bg-blue-700 transition duration-300"
          >
            {isLogin ? "Login" : "Register"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-sm text-center">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-blue-500 underline"
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
