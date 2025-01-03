import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import dnd from "@dnd-academy/eslint-config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...dnd,
    {
        rules: {
            "import/no-extraneous-dependencies": "off",
            "import/prefer-default-export": "off",
        },
    }, 
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                project: ["./tsconfig.json"],
                tsconfigRootDir: "/Users/levit/Documents/dnd-academy-v2/packages/core",
            },
        },
    }
];
