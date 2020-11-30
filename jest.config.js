module.exports = {
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text-summary",
    "lcov",
    "json-summary"
  ],
  "moduleNameMapper": {
    "^.+\\.(css|scss)$": "identity-obj-proxy",
    "^.+\\.(gif|ttf|eot|svg|jpg|png)$": "<rootDir>/__test__/fileMock.js",
    "^shared(.*)$": "<rootDir>/app/shared$1",
    "^main(.*)$": "<rootDir>/app/main$1",
  },
  "moduleDirectories": [
    "node_modules",
    "app/main/lib"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 60,
      "functions": 67,
      "lines": 70,
      "statements": 70
    }
  },
  "globals": {
    "__DEV__": true
  },
  "notify": true,
  "collectCoverageFrom": [
    "app/main/lib/**/*.{ts,tsx}"
  ],
  coveragePathIgnorePatterns: [
    "/scrapers/"
  ],
  "roots": [
    "<rootDir>/app/main/lib"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  }
};
