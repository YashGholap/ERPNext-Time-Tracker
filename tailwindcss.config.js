/** @type {import('tailwindcss').Config} */
export default {
    presets: [],
    content: [
        "./index.html",                    // root HTML
        "./src/renderer/src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
