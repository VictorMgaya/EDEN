/* eslint-disable react/no-unescaped-entities */
'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import UserInfo from "@/components/userinfo";
import { useSession } from "next-auth/react";

export default function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { status } = useSession();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(""); // Reset error message
        const userData = {
            name,
            image,
            email,
        };

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (response.ok) {
            await signIn("email", { email }); // Sign in with email
        } else {
            const errorData = await response.json();
            setErrorMessage(errorData.message || "Registration failed");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(""); // Reset error message
        const response = await signIn("email", { email, password });

        if (response?.error) {
            setErrorMessage("Login failed. Please check your credentials.");
        }
    };

    if (status === 'authenticated') {
        return <UserInfo />
    } else {

        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-3xl font-bold mb-4">{isRegistering ? "Register" : "Login"}</h1>
                {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
                <button onClick={() => signIn("google")} className=" bg-gradient-to-r from-red-500/50  to-green-500 flex items-center mb-4 rounded-2xl">
                    <Image src='/Google.svg' alt="Google Logo" width={40} height={40} />
                    <span className=" px-4 py-2 rounded-r-2xl">
                        Sign in with Google
                    </span>
                </button>
                {isRegistering ? (
                    <form onSubmit={handleRegister} className="flex flex-col">
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mb-2 p-2 border rounded-2xl"
                        />
                        <input
                            type="text"
                            placeholder="Profile Picture URL"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            required
                            className="mb-2 p-2 border rounded-2xl"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mb-2 p-2 border rounded-2xl"
                        />
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                required
                            />
                            <label htmlFor="terms" className="ml-2">
                                I agree to the{" "}
                                <a href="/privacy-policy" className="text-blue-500">Privacy Policy</a> and{" "}
                                <a href="/terms-of-service" className="text-blue-500">Terms of Service</a>
                            </label>
                        </div>
                        <button
                            type="submit"
                            className={`mb-4 bg-gradient-to-r from-blue-500 to-green-500 w-15 px-4 py-2 rounded-2xl ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!agreedToTerms}
                        >
                            Register
                        </button>
                        <button onClick={() => setIsRegistering(false)} className="text-blue-500">
                            Already have an account? Login
                        </button>
                    </form>
                ) : (
                    <div className="flex flex-col">
                        <form onSubmit={handleLogin} className="flex flex-col">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mb-2 p-2 border rounded-2xl"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mb-2 p-2 border rounded-2xl"
                            />
                            <button type="submit" className="mb-4 bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-2 rounded-2xl">
                                Sign in with Email
                            </button>
                            <button onClick={() => setIsRegistering(true)} className="text-blue-500">
                                Don't have an account? Register
                            </button>
                        </form>
                    </div>
                )}
            </div>

        );
    };
}