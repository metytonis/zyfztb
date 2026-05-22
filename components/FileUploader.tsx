import React, { useState, useCallback, useRef, DragEvent, forwardRef, useImperativeHandle } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { useTender } from '@/context/TenderContext'
import type { UploadedFile } from '@/types'

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const MAX_FILE_SIZE = 50 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function generateId(): string {
  return 'file-' + Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop()
  if (ext === 'pdf') return '📄'
  if (ext === 'doc' || ext === 'docx') return '📝'
  return '📎'
}

export interface FileUploaderRef {
  getFiles: () => File[]
}

export const FileUploader = forwardRef<FileUploaderRef>((_, ref) => {
  const { uploadedFiles, addUploadedFile, updateFileProgress, updateFileStatus, removeFile } = useTender()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [actualFiles, setActualFiles] = useState<Map<string, File>>(new Map())

  useImperativeHandle(ref, () => ({
    getFiles: () => Array.from(actualFiles.values())
  }))

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer?.files)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }, [])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    
    Array.from(files).forEach(file => {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        alert(`不支持的文件类型: ${ext}。仅支持 PDF 和 Word 文档。`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`文件大小超过限制: ${formatFileSize(file.size)}。最大支持 50MB。`)
        return
      }

      const id = generateId()
      
      const uploadedFile: UploadedFile = {
        id,
        name: file.name,
        type: ext,
        size: file.size,
        progress: 0,
        status: 'uploading',
      }

      addUploadedFile(uploadedFile)
      setActualFiles(prev => new Map(prev.set(id, file)))

      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          updateFileProgress(id, 100)
          updateFileStatus(id, 'completed')
        } else {
          updateFileProgress(id, progress)
        }
      }, 200)
    })
  }, [addUploadedFile, updateFileProgress, updateFileStatus])

  const handleRemoveFile = useCallback((id: string) => {
    removeFile(id)
    setActualFiles(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [removeFile])

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="space-y-6">
      {/* 拖拽上传区域 - 美化版 */}
      <div
        className={`relative transition-all duration-300 ${
          isDragging ? 'transform scale-102' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 transition-opacity duration-300 ${isDragging ? 'opacity-100' : ''}" />
        
        <Card
          className={`relative z-10 transition-all duration-300 cursor-pointer overflow-hidden ${
            isDragging
              ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl'
              : 'border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 hover:shadow-lg'
          }`}
          onClick={handleButtonClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            {/* 动画图标 */}
            <div className={`relative mb-6 transition-all duration-300 ${
              isDragging ? 'transform scale-110' : ''
            }`}>
              <div className={`p-5 rounded-full transition-all duration-300 ${
                isDragging 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-2xl' 
                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg'
              }`}>
                <Upload className={`w-12 h-12 transition-all duration-300 ${
                  isDragging ? 'text-white animate-bounce' : 'text-blue-600'
                }`} />
              </div>
              
              {/* 动态圆环效果 */}
              {isDragging && (
                <div className="absolute inset-0 -m-5 rounded-full border-4 border-blue-300 animate-ping opacity-20" />
              )}
            </div>
            
            {/* 标题 */}
            <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
              isDragging ? 'text-blue-700' : 'text-slate-700'
            }`}>
              {isDragging ? '释放以上传文件' : '拖拽文件到此处上传'}
            </h3>
            
            {/* 说明 */}
            <p className="text-base text-slate-600 mb-6 max-w-md">
              支持 PDF 和 Word 文档，单个文件最大 50MB
            </p>
            
            {/* 按钮 */}
            <Button 
              variant={isDragging ? 'default' : 'outline'} 
              size="lg"
              className={`px-8 h-12 text-base font-medium transition-all duration-300 ${
                isDragging 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' 
                  : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              选择文件
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* 格式提示 */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                📄 PDF
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                📝 Word
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 已上传文件列表 - 美化版 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">已上传文件</h4>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              {uploadedFiles.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <Card 
                key={file.id} 
                className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  file.status === 'completed' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                    : file.status === 'error'
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
                    : 'bg-white border border-slate-200'
                }`}
                style={{
                  animation: 'slideIn 0.3s ease-out',
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* 文件图标 */}
                    <div className={`p-3 rounded-xl transition-all ${
                      file.status === 'completed' 
                        ? 'bg-green-100' 
                        : file.status === 'error'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }`}>
                      {file.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      )}
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getFileIcon(file.name)}</span>
                        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        {file.status === 'analyzing' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          {formatFileSize(file.size)}
                        </span>
                        <span className={`font-medium px-3 py-0.5 rounded-full text-xs ${
                          file.status === 'uploading' 
                            ? 'bg-blue-100 text-blue-700' 
                            : file.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : file.status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {file.status === 'uploading' && '🔄 上传中'}
                          {file.status === 'completed' && '✅ 已完成'}
                          {file.status === 'error' && '❌ 出错'}
                          {file.status === 'analyzing' && '🤖 分析中'}
                        </span>
                      </div>
                      
                      {/* 进度条 */}
                      {(file.status === 'uploading' || file.status === 'analyzing') && (
                        <div className="mt-3">
                          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-slate-500">上传进度</span>
                            <span className="text-xs font-semibold text-blue-600">{Math.round(file.progress)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(file.id)
                      }}
                      className="hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
})

FileUploader.displayName = 'FileUploader'
