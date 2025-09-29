// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import reactNative from "eslint-plugin-react-native";
import prettier from "eslint-config-prettier";

export default [
js.configs.recommended,
{
files: ["**/*.ts", "**/*.tsx"],
languageOptions: {
parser: tsparser,
},
plugins: {
"@typescript-eslint": tseslint,
react,
"react-hooks": reactHooks,
"@next/next": next,
import: importPlugin,
"react-native": reactNative,
},
settings: {
react: { version: "detect" },
},
rules: {
"prettier/prettier": "warn"
}
},
prettier,
];
