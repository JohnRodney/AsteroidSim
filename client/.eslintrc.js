module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["standard"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-console": "off",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "prefer-const": "error",
    "no-var": "error",
    "comma-dangle": ["error", "never"],
    semi: ["error", "never"],
    quotes: ["error", "single"],
    "space-before-function-paren": ["error", "always"],
    indent: ["error", 2],
    "no-dupe-keys": "error",
  },
  globals: {
    BABYLON: "readonly",
    describe: "readonly",
    test: "readonly",
    expect: "readonly",
    beforeEach: "readonly",
    afterEach: "readonly",
    jest: "readonly",
  },
};
