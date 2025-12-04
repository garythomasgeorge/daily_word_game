/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'game-correct': '#6aaa64',
                'game-present': '#c9b458',
                'game-absent': '#787c7e',
                'game-bg': '#121213',
                'game-tile': '#3a3a3c',
                'game-text': '#ffffff',
            },
            animation: {
                'pop': 'pop 0.1s ease-in-out',
                'shake': 'shake 0.6s ease-in-out',
                'flip': 'flip 0.5s ease-in-out',
            },
            keyframes: {
                pop: {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '40%': { transform: 'scale(1.1)', opacity: '1' },
                    '100%': { transform: 'scale(1)' },
                },
                shake: {
                    '10%, 90%': { transform: 'translateX(-1px)' },
                    '20%, 80%': { transform: 'translateX(2px)' },
                    '30%, 50%, 70%': { transform: 'translateX(-4px)' },
                    '40%, 60%': { transform: 'translateX(4px)' },
                },
                flip: {
                    '0%': { transform: 'rotateX(0)' },
                    '50%': { transform: 'rotateX(90deg)' },
                    '100%': { transform: 'rotateX(0)' },
                }
            }
        },
    },
    plugins: [],
}
