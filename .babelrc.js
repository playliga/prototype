module.exports = {
  "presets": [
    ["@babel/env", {
      "targets": {
        "node": true
      }
    }],
    "@babel/typescript",
    "@babel/react",
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-transform-runtime"
  ]
};
