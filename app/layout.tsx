import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TenderProvider } from '@/context/TenderContext'
import '@/src/index.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '招标文件分析系统',
  description: '上传招标文件并自动分析关键信息',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <TenderProvider>{children}</TenderProvider>
      </body>
    </html>
  )
}