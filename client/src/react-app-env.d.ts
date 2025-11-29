/// <reference types="react" />
/// <reference types="react-dom" />

// Permissive JSX intrinsic elements fallback — temporary. Prefer installing correct
// @types/react and ensuring tsconfig.json has proper jsx settings.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
