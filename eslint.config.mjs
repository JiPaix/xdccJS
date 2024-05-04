import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules',
      'dist',
      '@types',
      '*.js',
      'test.*',
      'tests/',
      'src/lib/**',
      'src/**/*.d.ts',
      'src/version.json'
    ]
  }
];