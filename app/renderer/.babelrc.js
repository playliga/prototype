module.exports = {
  "presets": [
    "@babel/env",
    "@babel/typescript",
    "@babel/react"
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread",
    [
      "import",
      { "libraryName": "antd", "libraryDirectory": "es", "style": "css" }
    ]
  ],
  "env": {
    "development": {
      "plugins": [
        "react-hot-loader/babel"
      ]
    }
  }
};
