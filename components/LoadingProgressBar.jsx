"use client";

import React from 'react';

const LoadingProgressBar = ({ progress, isVisible }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '4px',
        backgroundColor: '#006816ff', // Green color
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'width 0.3s ease-in, opacity 0.5s ease-out',
        boxShadow: '0 0 10px #013b09ff, 0 0 5px #002c0aff',
      }}
    />
  );
};

export default LoadingProgressBar;
