const srcConfig = require('./src/tailwind.config.js');

module.exports = {
  ...srcConfig,
  content: ['./index.html', './src/app/**/*.{js,ts,jsx,tsx}', './src/actions/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}', './src/context/**/*.{js,ts,jsx,tsx}', './src/lib/**/*.{js,ts,jsx,tsx}', './src/pages/**/*.{js,ts,jsx,tsx}', './src/types/**/*.{js,ts,jsx,tsx}', './src/utils/**/*.{js,ts,jsx,tsx}', './src/main.tsx'],
};
