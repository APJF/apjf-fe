/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Unified Brand Colors - Red, White, Black Theme
            colors: {
                // Primary brand color (Red)
                primary: {
                    50: '#fef2f2',   // Very light red background
                    100: '#fee2e2',  // Light red background  
                    200: '#fecaca',  // Soft red
                    300: '#fca5a5',  // Medium light red
                    400: '#f87171',  // Medium red
                    500: '#ef4444',  // Base red
                    600: '#dc2626',  // Dark red (main brand) - JLPT Red
                    700: '#b91c1c',  // Darker red
                    800: '#991b1b',  // Very dark red
                    900: '#7f1d1d',  // Darkest red
                },
                
                // Background and foreground
                background: '#ffffff',  // Pure white
                foreground: '#111827',  // Near black (gray-900)
                
                // Semantic colors using red theme
                success: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
                
                warning: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                },
                
                error: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                },
                
                // Neutral grays (for text and borders)
                neutral: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
            },
            
            // Custom font family
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            
            // Custom spacing
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
            },
            
            // Custom animations
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            
            keyframes: {
                fadeIn: {
                    '0%': {opacity: '0'},
                    '100%': {opacity: '1'},
                },
                slideUp: {
                    '0%': {transform: 'translateY(20px)', opacity: '0'},
                    '100%': {transform: 'translateY(0)', opacity: '1'},
                }
            },
            
            // Box shadows using red theme
            boxShadow: {
                'red': '0 4px 14px 0 rgba(220, 38, 38, 0.1)',
                'red-lg': '0 10px 25px -3px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(220, 38, 38, 0.05)',
            },
        },
    },
    plugins: [
        // Plugin cho forms (cần cài thêm: @tailwindcss/forms)
        // require('@tailwindcss/forms'),
        // Plugin cho typography (cần cài thêm: @tailwindcss/typography)
        // require('@tailwindcss/typography'),
    ],
}

