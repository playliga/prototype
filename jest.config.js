module.exports = {
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text-summary",
    "lcov",
    "json-summary"
  ],
  "moduleNameMapper": {
    "^.+\\.(css|scss)$": "identity-obj-proxy",
    "^.+\\.(gif|ttf|eot|svg|jpg|png)$": "<rootDir>/__test__/fileMock.js"
  },
  "moduleDirectories": [
    "node_modules",
    "main-process/lib"
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
    "main-process/lib/**/*.{ts,tsx}"
  ],
  "roots": [
    "<rootDir>/main-process/lib"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  }
};
