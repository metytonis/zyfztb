import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
            <FileQuestion className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">页面未找到</h1>
          <p className="text-muted-foreground mb-8">
            您访问的页面不存在
          </p>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}