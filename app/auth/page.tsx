/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import UserInfo from '@/components/userinfo';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiImage } from 'react-icons/fi';

export default function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [image, setImage] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { status } = useSession();
    const router = useRouter(); const handleRegister = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    image: image || 'https://www.gravatar.com/avatar/?d=mp',
                    provider: 'credentials',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Registration failed');
                return;
            }

            const signInResult = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                setErrorMessage(signInResult.error);
                return;
            }

            router.push('/');
        } catch (error) {
            console.error('Registration error:', error);
            setErrorMessage('An error occurred during registration');
        }
    };

    const handleLogin = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setErrorMessage('Invalid email or password');
                return;
            }

            router.push('/auth');
        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage('An error occurred during login');
        }
    };
    if (status === 'authenticated') {
        return <UserInfo />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >

                {/* Add the logo here */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/eden.svg"
                        alt="EDEN Logo"
                        width={120}
                        height={120}
                        className="drop-shadow-lg"
                        onClick={() => router.push('/')}
                    />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h1>

                    {errorMessage && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-center">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        onClick={() => signIn('google')}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                    >
                        <Image src="/Google.svg" alt="Google" width={24} height={24} />
                        <span>Continue with Google</span>
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                        </div>
                    </div>

                    {isRegistering ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="relative">
                                <FiUser className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none"
                                />
                            </div>
                            <>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                                    />
                                </div>
                                {password !== confirmPassword && (
                                    <p className="text-red-500 text-sm">Passwords do not match</p>
                                )}
                            </>

                            {/* Add similar styling for email, password, confirm password inputs */}
                            <div className="relative">
                                <FiImage className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="url"
                                    placeholder="Profile Picture URL (optional)"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    required
                                    className="rounded text-blue-500"
                                />
                                <label htmlFor="terms" className="text-sm">
                                    I agree to the{' '}
                                    <a href="/privacy-policy" className="text-blue-500 hover:text-blue-600">
                                        Privacy Policy
                                    </a>{' '}
                                    and{' '}
                                    <a href="/terms-of-service" className="text-blue-500 hover:text-blue-600">
                                        Terms of Service
                                    </a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={!agreedToTerms}
                                className={`w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-green-600'}`}
                            >
                                Create Account
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <FiMail className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium hover:from-blue-600 hover:to-green-600"
                            >
                                Sign In
                            </button>
                        </form>
                    )}

                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="w-full text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                        {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

