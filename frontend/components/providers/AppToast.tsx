'use client';

import { Toaster } from "react-hot-toast";

export function AppToast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        success: {
          style: { background: '#16a34a', color: '#fff' },
        },
        error: {
          style: { background: '#dc2626', color: '#fff' },
        },
      }}
    />
  );
}
