export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    ignores: [
      ".next/**",
      "node_modules/**",
      ".vercel/**",
      "build/**",
      "dist/**"
    ]
  }
];
