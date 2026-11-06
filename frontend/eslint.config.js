import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist", "node_modules"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { react, "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      // This ESLint version does not register JSX tag usages in scope analysis;
      // enabling react/jsx-uses-vars marks <Component /> usages as variable uses.
      "react/jsx-uses-vars": "error",
      "react/prop-types": "off",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
    },
    settings: { react: { version: "detect" } },
  },
];
