// lib/util.js

import clsx from 'clsx';

/**
 * Utility function to conditionally join classNames.
 * Especially useful for dynamically applying Tailwind CSS classes.
 * @param {...(string | undefined | null | false | {[key: string]: boolean})} args - Class names or condition-object pairs.
 * @returns {string} - The resulting class name string.
 */
export function cn(...args) {
  return clsx(args);
}

/**
 * A utility function to format dates in a user-friendly way.
 * @param {Date | string} date - The date to format.
 * @returns {string} - Formatted date string.
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * A utility function to capitalize the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - String with the first letter capitalized.
 */
export function capitalize(str) {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * A utility function to debounce any function.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {Function} - A debounced version of the function.
 */
export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * A utility function to generate a random string of a given length.
 * @param {number} length - The length of the random string.
 * @returns {string} - The generated random string.
 */
export function randomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
