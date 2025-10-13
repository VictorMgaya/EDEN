'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // If user is authenticated, redirect to dashboard
  if (status === 'authenticated') {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Logo/Brand Section */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 mb-4 tracking-tight">
            EDEN
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl text-center font-light animate-fade-in">
          Resource Analysis Engine
        </p>
        
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl text-center leading-relaxed animate-fade-in-up">
          Unlock the power of environmental insights with cutting-edge geolocation analysis. 
          Make data-driven decisions for sustainable resource management.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up animation-delay-300">
          <button
            onClick={() => router.push('/auth?mode=signup')}
            className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 transform"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <button
            onClick={() => router.push('/auth?mode=signin')}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-green-500/50 rounded-full font-semibold text-lg hover:bg-white/20 hover:border-green-400 transition-all duration-300 hover:scale-105 transform"
          >
            Sign In
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 animate-fade-in-up animation-delay-600">
          {/* Feature 1 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 hover:bg-white/10 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-green-400">Geolocation Analysis</h3>
            <p className="text-gray-400">Precise environmental data based on your location coordinates</p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 hover:bg-white/10 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-green-400">Real-time Insights</h3>
            <p className="text-gray-400">Access live weather, soil, and resource data instantly</p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 hover:bg-white/10 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-green-400">Smart Analytics</h3>
            <p className="text-gray-400">AI-powered recommendations for optimal resource management</p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center animate-fade-in-up animation-delay-900">
          <p className="text-gray-400 mb-4">
            Join thousands of users making smarter environmental decisions
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Secure • Free to start • No credit card required</span>
          </div>
        </div>
      </div>

      {/* Custom animations using Tailwind */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}
