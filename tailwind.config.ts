import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10212b",
        mist: "#f4efe7",
        sand: "#efe4d1",
        coral: "#d66a4e",
        pine: "#29584a"
      },
      boxShadow: {
        card: "0 18px 48px rgba(16, 33, 43, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

