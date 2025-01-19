/* eslint-disable react/no-unescaped-entities */
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import UserInfo from '@/components/userinfo';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();

    const handleRegister = async (e: { preventDefault: () => void; }) => {
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
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">
                {isRegistering ? 'Register' : 'Login'}
            </h1>

            {errorMessage && (
                <div className="text-red-500 mb-4 text-center">{errorMessage}</div>
            )}

            <button
                onClick={() => signIn('google')}
                className="bg-gradient-to-r from-red-500/50 to-green-500 flex items-center mb-4 rounded-2xl"
            >
                <Image src="/Google.svg" alt="Google Logo" width={40} height={40} />
                <span className="px-4 py-2 rounded-r-2xl">Sign in with Google</span>
            </button>

            <div className="w-full max-w-md">
                {isRegistering ? (
                    <form onSubmit={handleRegister} className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="p-2 border rounded-2xl"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="p-2 border rounded-2xl"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="p-2 border rounded-2xl"
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="p-2 border rounded-2xl"
                        />
                        <input
                            type="url"
                            placeholder="Profile Picture URL (optional)"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="p-2 border rounded-2xl"
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                required
                            />
                            <label htmlFor="terms">
                                I agree to the{' '}
                                <a href="/privacy-policy" className="text-blue-500">
                                    Privacy Policy
                                </a>{' '}
                                and{' '}
                                <a href="/terms-of-service" className="text-blue-500">
                                    Terms of Service
                                </a>
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={!agreedToTerms}
                            className={`bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-2 rounded-2xl ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            Register
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRegistering(false)}
                            className="text-blue-500"
                        >
                            Already have an account? Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="flex flex-col gap-3">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="p-2 border rounded-2xl"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="p-2 border rounded-2xl"
                        />
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-2 rounded-2xl"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRegistering(true)}
                            className="text-blue-500"
                        >
                            Don't have an account? Register
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
