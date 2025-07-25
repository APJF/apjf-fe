/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Custom colors cho brand
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                background: '#ffffff',
                foreground: '#0f172a',
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
            }
        },
    },
    plugins: [
        // Plugin cho forms (cần cài thêm: @tailwindcss/forms)
        // require('@tailwindcss/forms'),
        // Plugin cho typography (cần cài thêm: @tailwindcss/typography)
        // require('@tailwindcss/typography'),
    ],
}

