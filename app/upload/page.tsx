'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileSearch, Loader2, CheckCircle2, AlertCircle, ArrowRight, Sparkles, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUploader, type FileUploaderRef } from '@/components/FileUploader';
import { useTender } from '@/context/TenderContext';
import { transformApiResponse, generateReviewRows } from '@/lib/dataTransform';
import type { ApiResponse } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const { uploadedFiles, updateFileStatus, setFinalJson, setReviewRows, setTenderData } = useTender();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'fallback' | 'error'>('idle');
  const [isVisible, setIsVisible] = useState(false);
  const fileUploaderRef = useRef<FileUploaderRef>(null);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  const hasCompletedFiles = completedFiles.length > 0;

  const handleAnalyze = async () => {
    if (!hasCompletedFiles || isAnalyzing) return;

    const files = fileUploaderRef.current?.getFiles() || [];
    if (files.length === 0) {
      alert('请先选择文件');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setApiStatus('testing');

    completedFiles.forEach(file => {
      updateFileStatus(file.id, 'analyzing');
    });

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.error || '分析失败');
      }

      const data: ApiResponse = await res.json();
      
      const finalJson = transformApiResponse(data);
      const reviewRows = generateReviewRows(finalJson);
      
      setFinalJson(finalJson);
      setReviewRows(reviewRows);
      
      setTenderData({
        id: 'analysis-' + Date.now(),
        title: finalJson.projectInfo?.projectName || '标书分析',
        category: '标书',
        budget: finalJson.projectInfo?.budget || 0,
        deadline: finalJson.projectInfo?.bidDeadline || '',
        requirements: [],
        evaluationCriteria: [],
        documents: [],
        createdAt: new Date().toISOString()
      });

      setApiStatus('success');
      setAnalysisComplete(true);
      
      setTimeout(() => {
        router.push('/review');
      }, 1500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(errorMessage);
      setApiStatus('error');
    } finally {
      setIsAnalyzing(false);
      completedFiles.forEach(file => {
        updateFileStatus(file.id, 'completed');
      });
    }
  };

  const handleGoToReview = () => {
    router.push('/review');
  };

  const getStatusMessage = () => {
    switch (apiStatus) {
      case 'testing':
        return '正在连接 AI 分析引擎...';
      case 'success':
        return '✨ 分析完成！正在跳转到人工确认页面...';
      case 'fallback':
        return '🔄 API 连接失败，使用模拟数据...';
      case 'error':
        return '⚠️ 分析出错，请查看错误信息';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className={`max-w-2xl w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl mb-4">
              <CloudUpload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">上传招标文件</h1>
            <p className="text-slate-400">支持 PDF、Word 格式，单文件最大 50MB</p>
          </div>

          {/* 上传卡片 */}
          <Card className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <CardContent className="p-6">
              <FileUploader ref={fileUploaderRef} />

              {/* 状态显示 */}
              {isAnalyzing && (
                <div className="mt-6 p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4 animate-pulse">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-blue-300 font-medium">{getStatusMessage()}</p>
                    <p className="text-blue-400/70 text-sm mt-1">请稍候，正在解析文档内容...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">分析失败</p>
                    <p className="text-red-400/70 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {analysisComplete && !error && (
                <div className="mt-6 p-5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-green-300 font-semibold">{getStatusMessage()}</p>
                    <p className="text-green-400/70 text-sm mt-1">数据已准备就绪，即将开始人工确认流程...</p>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                {analysisComplete && (
                  <Button 
                    variant="outline" 
                    onClick={handleGoToReview}
                    className="h-12 px-6 text-base hover:bg-white/10 border-white/20 text-white"
                  >
                    立即跳转到确认页面
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                <Button
                  onClick={handleAnalyze}
                  disabled={!hasCompletedFiles || isAnalyzing || analysisComplete}
                  className={`h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 ${
                    !hasCompletedFiles && 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      开始分析
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 提示信息 */}
          <div className="mt-6 text-center text-slate-500 text-sm">
            <p>💡 上传后系统将自动解析招标文件内容，提取关键参数和要求</p>
          </div>
        </div>
      </div>
    </div>
  );
}
