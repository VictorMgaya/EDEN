"use client";

import React from 'react';

const LoadingProgressBar = ({ progress, isVisible }) => {
  return (
    <div
      className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-green-600 shadow-lg transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: `${progress}%`,
        zIndex: 9999,
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 5px rgba(34, 197, 94, 0.5)',
      }}
    />
  );
};

export default LoadingProgressBar;
