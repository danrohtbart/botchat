'use client'
import { Inter } from 'next/font/google'
import './globals.css'
import { Authenticator, Divider } from '@aws-amplify/ui-react';


const inter = Inter({ subsets: ['latin'] })

export const VIEWPORT_CONTENT = 'width=device-width, initial-scale=1';

export default function RootLayout({ children }) {
  return (
    <html lang="en" title="Bot Chat">
      <head>
        <meta name="viewport" content={VIEWPORT_CONTENT} />
      </head>
{/*}      <Authenticator.Provider>*/}
        <body className={inter.className}>{children}
        </body>
{/*}      </Authenticator.Provider>*/}
    </html>
  )
}
