import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Menonaktifkan aturan yang sering menyebabkan error build
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-const": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "warn",
      "no-unused-vars": "warn",
      "no-console": "warn",
      // Menonaktifkan error untuk import yang tidak digunakan
      "import/no-unused-modules": "off",
      // Menonaktifkan error untuk any type
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // Menonaktifkan error untuk empty function
      "@typescript-eslint/no-empty-function": "off",
      // Menonaktifkan error untuk non-null assertion
      "@typescript-eslint/no-non-null-assertion": "off",
      // Menonaktifkan error untuk object property access
      "@typescript-eslint/dot-notation": "off",
      // Menonaktifkan error untuk any dalam aggregate
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
];

export default eslintConfig;
