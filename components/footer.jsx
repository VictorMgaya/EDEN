"use client";

import React from 'react';
import LanguageSelector from '@/components/LanguageSelector';

const Footer = () => {
  return (
    <footer className='footer mt-2 shadow-2xl bg-white dark:bg-gray-800 border-t border-blue-200 dark:border-gray-700 text-center font-primary px-4 py-16 rounded-t-2xl'>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="md:col-span-1">
            <p className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">&copy; {new Date().getFullYear()} Eden. All Rights Reserved.</p>
            <nav className="flex flex-col space-y-2">
              <a href="/privacypolicy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Privacy Policy</a>
              <a href="/about" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">About Us</a>
              <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Contact</a>
              <a href="/services" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Services</a>
            </nav>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Language & Region</h3>
            <div className="flex justify-center mb-4">
              <LanguageSelector />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Get location-based insights</p>
              <a href="/weather" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Weather & Location
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-200 dark:border-gray-700 pt-8">
          <div className="flex items-center justify-center space-x-4">
            <p className="text-gray-600 dark:text-gray-400">Powered</p>
            <p className="font-extrabold text-blue-600 dark:text-blue-400">By</p>
            <img src="/eden.svg" alt="Eden Logo" className="w-24 h-auto" loading='lazy' />
            <p className="text-gray-600 dark:text-gray-400">RAE</p>
          </div>
        </div>
      </div>

      <div id="google_translate_element" className="hidden" />
    </footer>
  );
};

export default Footer;
