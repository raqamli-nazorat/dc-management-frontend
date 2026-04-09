import type { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141414',
            color: '#F0F0F0',
            border: '1px solid #2A2A2A',
          },
          success: { iconTheme: { primary: '#4ADE80', secondary: '#141414' } },
          error: { iconTheme: { primary: '#F87171', secondary: '#141414' } },
        }}
      />
    </QueryProvider>
  )
}
