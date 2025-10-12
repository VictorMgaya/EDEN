"use client";

import React from 'react';
import LanguageSelector from '@/components/LanguageSelector';

const Footer = () => {
  return (
    <footer className='footer mt-5 shadow-2xl bg-white dark:bg-gray-800 border-t border-blue-200 dark:border-gray-700 text-center font-primary px-4 py-16 rounded-t-2xl'>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">&copy; {new Date().getFullYear()} Eden. All Rights Reserved.</p>
            <nav className="flex flex-col space-y-2">
              <a href="/privacypolicy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Privacy Policy</a>
              <a href="/about" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">About Us</a>
              <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Contact</a>
            </nav>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Follow Us</h3>
            <div className="flex justify-center space-x-4">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Facebook</a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Twitter</a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Instagram</a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Language</h3>
            <div className="flex justify-center">
              <LanguageSelector />
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
