import tseslint from "typescript-eslint";

export default tseslint.config(...tseslint.configs.recommended, {
  ignores: ["**/*.js", "**/*.d.ts", "cdk.out/**"],
});
