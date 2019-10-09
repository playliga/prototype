module.exports = {
  "env": {
    "es6": true,
    "browser": true,
    "node": true,
    "jest": true
  },
  "parser": '@typescript-eslint/parser',
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
        "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "@typescript-eslint"
  ],
  "settings": {
    "react": {
      "version": "latest"
    }
  },
  "rules": {
    "eqeqeq": [
      "error"
    ],
    "indent": "off",
    "linebreak-style": [
      "error",
      "unix"
    ],
    "no-var": [
      "error"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "react/display-name": "off",
    "semi": [
      "error",
      "always"
    ],
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/class-name-casing": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/no-use-before-define": "off"
  },
  "globals": {
    "fetch": true
  }
};
