import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{html,js,ts,jsx,tsx,mdx,csv}",
    "./components/**/*.{html,js,ts,jsx,tsx,mdx,csv}",
    "./app/**/*.{html,js,ts,jsx,tsx,mdx,csv}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '15px'
  	},
  	screens: {
  		sm: '640px',
  		md: '768px',
  		lg: '1024px',
  		xl: '1280px'
  	},
  	fontFamily: {
  		primary: [
  			'Lexend',
  		]
  	},
  	extend: {
  		colors: {
  			primary: '#052e16',
  			accent: {
  				DEFAULT: '#00ff99',
  				hover: '#00e187'
  			},
  			gray: {
  				'200': '#e5e7eb'
  			},
  			black: '#000000',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'spin-slow': 'spin 3s linear infinite'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;