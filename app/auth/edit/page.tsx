'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiMail, FiUser, FiImage, FiFileText, FiArrowLeft } from 'react-icons/fi';

export default function EditProfilePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');
    const [bio, setBio] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const { data: session, status } = useSession();
    const router = useRouter();

    // Load user profile data
    useEffect(() => {
        const loadUserProfile = async () => {
            if (status === 'authenticated' && session?.user?.email) {
                try {
                    const response = await fetch(`/api/users/profile?email=${encodeURIComponent(session.user.email)}`);
                    if (response.ok) {
                        const userData = await response.json();
                        setName(userData.name || '');
                        setEmail(userData.email || '');
                        setImage(userData.image || '');
                        setBio(userData.bio || '');
                    } else {
                        setErrorMessage('Failed to load profile data');
                    }
                } catch (error) {
                    console.error('Error loading profile:', error);
                    setErrorMessage('An error occurred while loading your profile');
                } finally {
                    setIsLoadingProfile(false);
                }
            } else if (status === 'unauthenticated') {
                router.push('/auth');
            } else if (status === 'loading') {
                setIsLoadingProfile(true);
            }
        };

        loadUserProfile();
    }, [status, session, router]);

    const handleUpdateProfile = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        // Validate bio word count
        const wordCount = bio.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 15) {
            setErrorMessage(`Bio must be at least 15 words. Current word count: ${wordCount}`);
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
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sanitizedName,
                    email: sanitizedEmail,
                    image: image.trim() || 'https://www.gravatar.com/avatar/?d=mp',
                    bio: sanitizedBio,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Failed to update profile');
                setIsLoading(false);
                return;
            }

            setSuccessMessage('Profile updated successfully!');
            // Refresh the page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Update error:', error);
            setErrorMessage('An error occurred while updating your profile');
            setIsLoading(false);
        }
    };

    if (status === 'loading' || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/auth');
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Add the logo here */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/eden.svg"
                        alt="EDEN Logo"
                        width={80}
                        height={80}
                        className="drop-shadow-lg"
                    />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        Edit Profile
                    </h1>

                    {errorMessage && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-center">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg text-center">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                            <FiImage className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="url"
                                placeholder="Profile Picture URL (optional)"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                disabled={isLoading}
                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none disabled:opacity-50"
                            />
                        </div>

                        <div className="relative">
                            <FiFileText className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                placeholder="Write a bio about yourself (minimum 15 words)..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                required
                                rows={6}
                                maxLength={500}
                                disabled={isLoading}
                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none resize-none disabled:opacity-50"
                            />
                            <div className={`text-xs mt-1 ${bio.trim().split(/\s+/).filter((word: string) => word.length > 0).length >= 15 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {bio.trim().split(/\s+/).filter((word: string) => word.length > 0).length} / 15 words minimum {bio.trim().split(/\s+/).filter((word: string) => word.length > 0).length >= 15 && '✓'}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim() || !email.trim() || !bio.trim() || bio.trim().split(/\s+/).filter(word => word.length > 0).length < 15 || isLoading}
                            className={`w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium ${
                                (isLoading || !name.trim() || !email.trim() || !bio.trim() || bio.trim().split(/\s+/).filter(word => word.length > 0).length < 15)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:from-blue-600 hover:to-green-600'
                            }`}
                        >
                            {isLoading ? 'Updating Profile...' : 'Update Profile'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
