'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">招标文件智能分析</h1>
        <Button asChild className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-indigo-600">
          <Link href="/upload">开始上传</Link>
        </Button>
      </div>
    </div>
  )
}
