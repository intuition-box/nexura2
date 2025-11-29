// Temporary global JSX fallback to silence intrinsic element type errors while we
// align @types/react across the monorepo. Remove once types are fixed.
import React from 'react';

declare global {
  namespace JSX {
    // allow any intrinsic elements temporarily
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
