module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "google",
    ],
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "indent": ["error", 4],
        "keyword-spacing": "off",
        "max-len": ["error", 120],
        "quotes": ["error", "double"],
    }
};
