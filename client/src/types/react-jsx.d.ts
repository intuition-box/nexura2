// Temporary global JSX fallback to allow intrinsic HTML elements and ease migration
// This file provides a permissive IntrinsicElements mapping for TypeScript when
// React types are not properly resolved. It should be removed once proper
// @types/react / tsconfig JSX settings are fixed.

declare namespace JSX {
  // allow any intrinsic element name with any props
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
