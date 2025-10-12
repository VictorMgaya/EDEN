/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import UserInfo from '@/components/userinfo';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiImage, FiFileText, FiX } from 'react-icons/fi';

export default function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [image, setImage] = useState('');
    const [bio, setBio] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showBioModal, setShowBioModal] = useState(false);
    const [modalBio, setModalBio] = useState('');
    const [isSubmittingBio, setIsSubmittingBio] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();

    // Check if user needs to create bio on mount and session change
    useEffect(() => {
        const checkUserBio = async () => {
            if (status === 'authenticated' && session?.user?.email) {
                try {
                    const response = await fetch(`/api/users/profile?email=${encodeURIComponent(session.user.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        const wordCount = data.bio ? data.bio.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0;
                        if (!data.bio || data.bio.trim().length === 0 || wordCount < 50) {
                            setShowBioModal(true);
                        }
                    }
                } catch (error) {
                    console.error('Error checking user bio:', error);
                }
            }
        };

        checkUserBio();
    }, [status, session]);

    const handleRegister = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long');
            setIsLoading(false);
            return;
        }

        // Validate bio word count
        const wordCount = bio.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 50) {
            setErrorMessage(`Bio must be at least 50 words. Current word count: ${wordCount}`);
            setIsLoading(false);
            return;
        }

        // Sanitize inputs
        const sanitizedName = name.trim();
        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedBio = bio.trim();

        if (!sanitizedName || !sanitizedEmail || !sanitizedBio) {
            setErrorMessage('Please fill in all required fields');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sanitizedName,
                    email: sanitizedEmail,
                    password,
                    image: image.trim() || 'https://www.gravatar.com/avatar/?d=mp',
                    provider: 'credentials',
                    bio: sanitizedBio,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Registration failed');
                setIsLoading(false);
                return;
            }

            const signInResult = await signIn('credentials', {
                email: sanitizedEmail,
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                setErrorMessage(signInResult.error);
                setIsLoading(false);
                return;
            }

            router.push('/');
        } catch (error) {
            console.error('Registration error:', error);
            setErrorMessage('An error occurred during registration');
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        const sanitizedEmail = email.trim().toLowerCase();

        if (!sanitizedEmail || !password) {
            setErrorMessage('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            const result = await signIn('credentials', {
                email: sanitizedEmail,
                password,
                redirect: false,
            });

            if (result?.error) {
                setErrorMessage('Invalid email or password');
                setIsLoading(false);
                return;
            }

            router.push('/');
        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage('An error occurred during login');
            setIsLoading(false);
        }
    };

    const handleBioRedirect = () => {
        setShowBioModal(false);
        router.push('/auth/edit');
    };

    const handleLogout = async () => {
        setShowBioModal(false);
        await signOut({ redirect: false });
        router.push('/auth');
    };

    // Calculate word count
    const bioWordCount = bio.trim().split(/\s+/).filter(word => word.length > 0).length;
    const isWordCountValid = bioWordCount >= 50;
    
    const modalBioWordCount = modalBio.trim().split(/\s+/).filter(word => word.length > 0).length;
    const isModalBioValid = modalBioWordCount >= 50;

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (status === 'authenticated' && !showBioModal) {
        return <UserInfo />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
            {/* Bio Modal */}
            <AnimatePresence>
                {showBioModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                                    Complete Your Profile
                                </h2>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Tell us about yourself to get more personalized analysis and recommendations. This helps us understand you better and provide tailored insights.
                            </p>

                            {errorMessage && (
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-center mb-4">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="relative mb-4">
                                <FiFileText className="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    placeholder="Write about yourself - your interests, background, goals, or anything you'd like to share (minimum 50 words)..."
                                    value={modalBio}
                                    onChange={(e) => setModalBio(e.target.value)}
                                    rows={6}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none resize-none"
                                />
                                <div className={`text-xs mt-1 ${isModalBioValid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {modalBioWordCount} / 50 words minimum {isModalBioValid && '✓'}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBioRedirect}
                                    className="flex-1 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium hover:from-blue-600 hover:to-green-600"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-6 p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Add the logo here */}
                <div className="flex justify-center mb-8 cursor-pointer" onClick={() => router.push('/')}>
                    <Image
                        src="/eden.svg"
                        alt="EDEN Logo"
                        width={120}
                        height={120}
                        className="drop-shadow-lg"
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
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    maxLength={100}
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none disabled:opacity-50"
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
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="Password (min 8 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none disabled:opacity-50"
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
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none disabled:opacity-50"
                                />
                            </div>
                            {password !== confirmPassword && password && confirmPassword && (
                                <p className="text-red-500 text-sm">Passwords do not match</p>
                            )}

                            <div className="relative">
                                <FiImage className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="url"
                                    placeholder="Profile Picture URL (optional)"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-50"
                                />
                            </div>

                            <div className="relative">
                                <FiFileText className="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    placeholder="Write a bio about yourself (minimum 50 words)..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    required
                                    rows={4}
                                    maxLength={500}
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none resize-none disabled:opacity-50"
                                />
                                <div className={`text-xs mt-1 ${isWordCountValid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {bioWordCount} / 50 words minimum {isWordCountValid && '✓'}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    required
                                    disabled={isLoading}
                                    className="rounded text-blue-500 disabled:opacity-50"
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
                                disabled={!agreedToTerms || !isWordCountValid || isLoading}
                                className={`w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium ${
                                    (!agreedToTerms || !isWordCountValid || isLoading)
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:from-blue-600 hover:to-green-600'
                                }`}
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
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
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none disabled:opacity-50"
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
                                    disabled={isLoading}
                                    className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium ${
                                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-green-600'
                                }`}
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setErrorMessage('');
                        }}
                        disabled={isLoading}
                        className="w-full text-blue-500 hover:text-blue-600 text-sm font-medium disabled:opacity-50"
                    >
                        {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
