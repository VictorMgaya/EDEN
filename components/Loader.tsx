/* eslint-disable @typescript-eslint/prefer-as-const */
import React from 'react';

const BeanSproutLoader: React.FC = () => {
  const styles = {
    loaderContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    },
    plantContainer: {
      position: 'relative' as 'relative',
      width: '200px',
      height: '200px',
    },
    stem: {
      position: 'absolute' as 'absolute',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '10px',
      height: '0',
      background: 'linear-gradient(to top, #228B22, #32CD32)',
      borderRadius: '5px',
      animation: 'growStem 1s ease-in-out forwards', // Reduced from 2s to 1s
    },
    leafLeft: {
      position: 'absolute' as 'absolute',
      bottom: '100px', // Positioned at the top of the stem
      left: '50%',
      width: '80px', // Larger leaf
      height: '50px', // Larger leaf
      background: 'linear-gradient(to bottom, #32CD32, #228B22)', // Gradient for a natural leaf
      borderRadius: '50% 50% 0 50%',
      transform: 'translateX(-100%) rotate(-45deg) scale(0)', // Start with scale(0)
      transformOrigin: 'bottom right', // Rotate from the base
      animation: 'growLeafLeft 0.5s ease-in-out 1s forwards', // Reduced from 1s to 0.5s, starts at 1s
    },
    leafRight: {
      position: 'absolute' as 'absolute',
      bottom: '100px', // Positioned at the top of the stem
      right: '50%',
      width: '80px', // Larger leaf
      height: '50px', // Larger leaf
      background: 'linear-gradient(to bottom, #32CD32, #228B22)', // Gradient for a natural leaf
      borderRadius: '50% 50% 50% 0',
      transform: 'translateX(100%) rotate(45deg) scale(0)', // Start with scale(0)
      transformOrigin: 'bottom left', // Rotate from the base
      animation: 'growLeafRight 0.5s ease-in-out 1.25s forwards', // Reduced from 1s to 0.5s, starts at 1.25s
    },
  };

  // Define the keyframes for the animations
  const styleSheet = `
    @keyframes growStem {
      0% { height: 0; }
      100% { height: 100px; }
    }
    @keyframes growLeafLeft {
      0% { opacity: 0; transform: translateX(-100%) rotate(-45deg) scale(0); }
      100% { opacity: 1; transform: translateX(-100%) rotate(-45deg) scale(1); }
    }
    @keyframes growLeafRight {
      0% { opacity: 0; transform: translateX(100%) rotate(45deg) scale(0); }
      100% { opacity: 1; transform: translateX(100%) rotate(45deg) scale(1); }
    }
  `;

  return (
    <>
      {/* Inject the stylesheet */}
      <style>{styleSheet}</style>
      <div style={styles.loaderContainer}>
        <div style={styles.plantContainer}>
          {/* Stem */}
          <div style={styles.stem}></div>
          {/* Left Leaf */}
          <div style={styles.leafLeft}></div>
          {/* Right Leaf */}
          <div style={styles.leafRight}></div>
        </div>
      </div>
    </>
  );
};

export default BeanSproutLoader;