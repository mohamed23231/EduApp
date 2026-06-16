module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest-setup.ts',
    '!**/docs/**',
    '!**/cli/**',
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|@sentry/.*|native-base|react-native-svg|@gorhom/.*|@shopify/.*|@tanstack/.*|react-native-reanimated|react-native-mmkv|react-native-nitro-modules|react-native-worklets|moti|zustand|tailwind-merge|tailwind-variants|uniwind))`,
  ],
  coverageReporters: ['json-summary', ['text', { file: 'coverage.txt' }]],
  reporters: [
    'default',
    ['github-actions', { silent: false }],
    'summary',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'jest-junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
  coverageDirectory: '<rootDir>/coverage/',
  // Coverage ratchet (002-ui-redesign B-1). Floors are set just below the
  // measured baseline so coverage can never regress; raise them as batches add
  // tests. NOTE: global mobile coverage is ~16% (large untested screen files),
  // so reaching the 80% project target is a separate test-backfill track, not
  // part of the UI restyle.
  //
  // The shared UI primitives in src/components/ui carry the highest test
  // density (State Kit primitives 80–100%; directory aggregate ~58% lines).
  // A path-specific floor pins that directory so a future PR cannot silently
  // delete its tests and drop it toward 0% while the global floor still passes.
  coverageThreshold: {
    'global': { lines: 15, statements: 15, functions: 14, branches: 15 },
    './src/components/ui/': { lines: 52, statements: 52, functions: 42, branches: 50 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
