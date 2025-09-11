import tsparser from "@typescript-eslint/parser";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";

import type { Config } from "@eslint/config-helpers";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import solid from "eslint-plugin-solid";

export const eslintConfig = {
  files: ["src/**/*.{ts,tsx,mts}"],
  ignores: ["dist", "build", "coverage", "node_modules"],

  languageOptions: {
    globals: globals.browser,
    parser: tsparser,
    sourceType: "module",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },

  plugins: { "@typescript-eslint": tseslint, unicorn, sonarjs, solid },

  rules: {
    ...tseslint.configs.recommended.rules,
    ...unicorn.configs.recommended.rules,
    ...sonarjs.configs.recommended.rules,
    ...solid.configs.typescript.rules,
    semi: ["error", "always"],
    quotes: ["error", "double"],
    "@typescript-eslint/no-unused-vars": "warn",
    "max-len": "off",
    "max-depth": ["error", 2],

    /* Complexity */
    complexity: ["error", 10],
    "no-useless-catch": "error",
    "no-useless-constructor": "warn",
    "no-continue": "off",
    "no-useless-escape": "warn",
    "no-else-return": ["error", { allowElseIf: false }],
    "no-dupe-else-if": "error",
    "no-lonely-if": "error",
    "no-negated-condition": "error",
    "no-useless-return": "warn",
    "no-useless-computed-key": "warn",
    "prefer-arrow-callback": "warn",
    "array-callback-return": "warn",
    "prefer-template": "error",
    "prefer-const": "error",
    "no-var": "warn",
    "prefer-exponentiation-operator": "warn",
    "unicorn/no-useless-fallback-in-spread": "warn",
    "unicorn/no-this-assignment": "warn",
    "unicorn/prefer-global-this": "off",
    "unicorn/no-array-callback-reference": "off",

    /* Suspicious */
    eqeqeq: ["warn", "always"],
    "no-debugger": "warn",
    "no-alert": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-inferrable-types": "off",
    "no-console": ["off", { allow: ["warn", "error"] }],

    /* Style */
    "@typescript-eslint/array-type": ["warn", { default: "generic" }],
    "@typescript-eslint/no-redeclare": ["error"],
    "@typescript-eslint/consistent-type-imports": "warn",
    "unicorn/consistent-function-scoping": "warn",
    "unicorn/prefer-default-parameters": "error",
    "unicorn/prefer-top-level-await": "off",
    "unicorn/prefer-ternary": "warn",
    "unicorn/prevent-abbreviations": "off",
    "unicorn/no-array-for-each": "off",
    "no-unused-expressions": ["error", { allowTaggedTemplates: true }],
    "sonarjs/no-commented-code": "warn",

    /* Correctness */
    "no-const-assign": "error",

    /* Nursery */
    "no-await-in-loop": "error",
    "sonarjs/no-nested-template-literals": "warn",
    "max-lines-per-function": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
    "max-lines": ["error", { max: 250, skipBlankLines: true }],

    /* Performance */
    "unicorn/prefer-regexp-test": "error",

    "no-restricted-syntax": [
      "error",
      {
        selector:
          "CallExpression[callee.property.name='forEach'] > ArrowFunctionExpression[async=true]",
        message: "Don't use async functions inside forEach — use for...of or Promise.all instead.",
      },
      "warn",
      {
        selector: "ExportDefaultDeclaration",
        message: "Prefer named exports",
      },
    ],
  },
} as unknown as Config;
