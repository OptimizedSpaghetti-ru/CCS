/// <reference types="vite/client" />

// The existing project has no @types/react-dom. Keep this preview's minimal
// client-entry declaration local instead of installing a new dependency.
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export interface Root { render(children: ReactNode): void; unmount(): void; }
  export function createRoot(container: Element | DocumentFragment): Root;
}
