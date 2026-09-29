import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: "#22307A", dark: "#182358", soft: "#E8EBF7" },
        madder: "#B5372F",
        saffron: "#D9982B",
        cloth: "#F5F6F8",
        ink: "#161A2B",
      },
    },
  },
  plugins: [],
};
export default config;
