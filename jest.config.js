// jest.config.js
module.exports = {
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.+(js|jsx|ts|tsx)', // Added ts/tsx for completeness
        '**/?(*.)+(spec|test).+(js|jsx|ts|tsx)',
    ],
    // For Jest 29, 'jest-environment-jsdom' is explicitly used.
    // Ensure jest-environment-jsdom is v29.x.x in your package.json
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // With Jest 29's improved ESM support, we might not need explicit mapping
        // for react-router-dom if transformIgnorePatterns is set correctly.
        // Let's try without it first.
    },
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}', // Added ts/tsx
        '!src/index.{js,jsx,ts,tsx}',
        '!src/reportWebVitals.{js,jsx,ts,tsx}',
        '!src/setupTests.{js,jsx,ts,tsx}',
        '!src/backend/config/db.js',
    ],
    transform: {
        // Use babel-jest (now v29.x.x) to transform JS, JSX, MJS, TS, TSX files.
        '^.+\\.(js|jsx|mjs|ts|tsx)$': 'babel-jest',
    },
    // Jest 29 has better native ESM support.
    // This pattern tells Jest to NOT ignore modules that are known to be ESM
    // and might need transformation.
    // The goal is to transform problematic ESM dependencies in node_modules.
    transformIgnorePatterns: [
        // Default is usually '/node_modules/', which ignores all.
        // We need to allow transformation for specific ESM modules.
        // For react-router-dom v7, this is often needed.
        '/node_modules/(?!(react-router-dom|@remix-run/router|react-router)/)',
    ],
    moduleFileExtensions: ["js", "jsx", "mjs", "ts", "tsx", "json", "node"], // Added ts/tsx
    // Jest 29 has experimentalVMModules for true ESM support in tests,
    // but it can be complex to set up with Babel. Let's try without it first.
    // experimentalVMModules: true, // Consider if still facing ESM issues
};
