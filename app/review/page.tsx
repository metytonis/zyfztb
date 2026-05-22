'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Clock, DollarSign, CheckSquare, Filter, Download, Loader2, FileText, Award, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useTender } from '@/context/TenderContext'
import { generateMockReviewRows, MOCK_FINAL_JSON } from '@/data/mockData'
import type { Rating } from '@/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount)
}

function formatCountdown(deadline: string): string {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return '已截止'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${days}天 ${hours}小时 ${minutes}分钟`
}

function getRatingColor(rating: Rating): string {
  switch (rating) {
    case '完全满足':
      return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
    case '部分满足':
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30'
    case '不满足':
      return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
    case '知识库未匹配':
      return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30'
  }
}

function getRatingIcon(rating: Rating) {
  switch (rating) {
    case '完全满足':
      return '✓'
    case '部分满足':
      return '~'
    case '不满足':
      return '✗'
    case '知识库未匹配':
      return '?'
  }
}

export default function ReviewPage() {
  const { finalJson, setFinalJson, reviewRows, setReviewRows, updateReviewRow } = useTender()
  const [showOnlyUnconfirmed, setShowOnlyUnconfirmed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!finalJson) {
      setFinalJson(MOCK_FINAL_JSON)
      setReviewRows(generateMockReviewRows(MOCK_FINAL_JSON))
    }
  }, [finalJson, setFinalJson, setReviewRows])

  const stats = useMemo(() => {
    const total = reviewRows.length
    const confirmed = reviewRows.filter(r => r.status === 'confirmed').length
    const fullyMet = reviewRows.filter(r => (r.manualRating || r.aiRating) === '完全满足').length
    const partiallyMet = reviewRows.filter(r => (r.manualRating || r.aiRating) === '部分满足').length
    const notMet = reviewRows.filter(r => (r.manualRating || r.aiRating) === '不满足').length
    const unmatched = reviewRows.filter(r => (r.manualRating || r.aiRating) === '知识库未匹配').length

    return { total, confirmed, fullyMet, partiallyMet, notMet, unmatched }
  }, [reviewRows])

  const filteredRows = useMemo(() => {
    if (showOnlyUnconfirmed) {
      return reviewRows.filter(r => r.status !== 'confirmed')
    }
    return reviewRows
  }, [reviewRows, showOnlyUnconfirmed])

  const handleAdoptAll = () => {
    const newRows = reviewRows.map(row => ({
      ...row,
      manualRating: row.aiRating,
      status: 'confirmed' as const,
    }))
    setReviewRows(newRows)
  }

  const handleGenerateProofList = async () => {
    setIsGenerating(true)
    try {
      const parameters = reviewRows
        .filter(r => r.itemType === '参数')
        .map(r => ({
          id: r.id,
          originalText: r.originalText,
          aiProductModel: r.aiProductModel,
          aiParamValue: r.aiParamValue,
          manualRating: r.manualRating || '',
          aiRating: r.aiRating,
          evidenceType: '',
          certificateNo: '',
          manualComment: r.manualComment || '',
        }))

      const qualifications = reviewRows
        .filter(r => r.itemType === '资质')
        .map(r => ({
          id: r.id,
          originalText: r.originalText,
          manualRating: r.manualRating || '',
          aiRating: r.aiRating,
          evidenceType: '',
          certificateNo: '',
          manualComment: r.manualComment || '',
        }))

      const unmatched = finalJson?.unmatchedList.map((item, idx) => ({
        id: `unmatched-${idx}`,
        itemType: item.itemType,
        itemName: item.itemName,
        rating: item.rating,
        suggestedAction: item.suggestedAction,
      })) || []

      const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameters,
          qualifications,
          unmatched,
          projectInfo: finalJson?.projectInfo || {},
        }),
      })

      const result = await response.json()

      if (result.success && result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `analysis_report_${Date.now()}.docx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('生成文档失败')
      }
    } catch (error) {
      console.error('Error generating document:', error)
      alert('生成文档失败')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!finalJson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">正在加载数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex flex-col">
      {/* 顶部固定栏 */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">人工确认工作台</h1>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 ml-0 lg:ml-8">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-slate-400">项目:</span>
                  <span className="font-semibold text-white">{finalJson.projectInfo.projectName}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">预算:</span>
                  <span className="font-semibold text-green-400">{formatCurrency(finalJson.projectInfo.budget)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-400">截止:</span>
                  <span className="font-semibold text-orange-400">
                    {formatCountdown(finalJson.projectInfo.bidDeadline)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={showOnlyUnconfirmed ? 'default' : 'outline'}
                size='sm'
                onClick={() => setShowOnlyUnconfirmed(!showOnlyUnconfirmed)}
                className={`gap-2 transition-all ${
                  showOnlyUnconfirmed 
                    ? 'bg-blue-600 hover:bg-blue-500' 
                    : 'border-white/20 text-white hover:bg-white/10'
                }`}
              >
                <Filter className="w-4 h-4" />
                {showOnlyUnconfirmed ? '显示全部' : '只看未确认'}
              </Button>
              <Button 
                size='sm' 
                onClick={handleAdoptAll} 
                className='gap-2 bg-green-600 hover:bg-green-500'
              >
                <CheckSquare className="w-4 h-4" />
                一键采纳AI结果
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="p-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.confirmed}/{stats.total}</div>
                <div className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  已确认
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{stats.fullyMet}</div>
                <div className="text-xs font-medium text-green-400 flex items-center justify-center gap-1">
                  <Award className="w-3 h-3" />
                  完全满足
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.partiallyMet}</div>
                <div className="text-xs font-medium text-yellow-400">部分满足</div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">{stats.notMet}</div>
                <div className="text-xs font-medium text-red-400">不满足</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-500/10 border border-gray-500/20 hover:bg-gray-500/15 transition-colors col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-gray-400 mb-1">{stats.unmatched}</div>
                <div className="text-xs font-medium text-gray-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  未匹配
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 主体表格 */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-800/50 border-b border-white/10">
                    <TableRow>
                      <TableHead className="w-16 text-center font-bold text-slate-300">已确认</TableHead>
                      <TableHead className="font-bold text-slate-300">标书参数原文</TableHead>
                      <TableHead className="font-bold text-slate-300">AI初评结果</TableHead>
                      <TableHead className="font-bold text-slate-300">人工确认</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, index) => {
                      const isUnmatched = row.aiRating === '知识库未匹配'
                      const displayRating = row.manualRating || row.aiRating
                      const bgClass = isUnmatched ? 'bg-red-500/5' : index % 2 === 0 ? 'bg-white/5' : 'bg-white/2.5'

                      return (
                        <TableRow key={row.id} className={`${bgClass} hover:bg-white/10 transition-colors ${row.status === 'confirmed' ? 'opacity-70' : ''}`}>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={row.status === 'confirmed'}
                                onChange={(e) => {
                                  updateReviewRow(row.id, {
                                    status: e.target.checked ? 'confirmed' : 'pending_confirm',
                                  })
                                }}
                                className="bg-white/10 border-white/20"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-300">
                            <div className="flex items-start gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-slate-400 text-xs font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="whitespace-pre-wrap">{row.originalText}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {row.aiProductModel && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-500">型号:</span>
                                  <span className="font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                    {row.aiProductModel}
                                  </span>
                                </div>
                              )}
                              {row.aiParamValue && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-500">参数:</span>
                                  <span className="text-slate-300">{row.aiParamValue}</span>
                                </div>
                              )}
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold">
                                <span className={`px-2 py-0.5 rounded-full ${getRatingColor(row.aiRating)}`}>
                                  {getRatingIcon(row.aiRating)} {row.aiRating}
                                </span>
                              </div>
                              {row.aiMatchDetails && (
                                <div className="text-xs text-slate-500 mt-1 pl-1">
                                  {row.aiMatchDetails}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Select
                                value={displayRating}
                                disabled={isUnmatched}
                                onChange={(e) => {
                                  updateReviewRow(row.id, {
                                    manualRating: e.target.value as Rating,
                                  })
                                }}
                                className={`font-medium bg-white/10 border-white/20 ${isUnmatched ? 'opacity-50' : ''}`}
                              >
                                <option value='完全满足'>✓ 完全满足</option>
                                <option value='部分满足'>~ 部分满足</option>
                                <option value='不满足'>✗ 不满足</option>
                                <option value='知识库未匹配'>? 知识库未匹配</option>
                              </Select>
                              <Textarea
                                placeholder='输入人工确认备注...'
                                value={row.manualComment || ''}
                                onChange={(e) => {
                                  updateReviewRow(row.id, {
                                    manualComment: e.target.value,
                                  })
                                }}
                                className='h-20 resize-none text-sm bg-white/10 border-white/20 text-slate-300 placeholder:text-slate-500'
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 底部固定栏 */}
      <footer className="sticky bottom-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-300">
                  已确认: <span className="font-bold text-lg text-blue-400">{stats.confirmed}</span>
                  <span className="text-slate-500"> / </span>
                  <span className="font-bold text-lg text-white">{stats.total}</span>
                </span>
              </div>
              
              <div className="hidden sm:block w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(stats.confirmed / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerateProofList}
              disabled={stats.confirmed < stats.total || isGenerating}
              className={`gap-2 text-base px-8 h-12 ${
                stats.confirmed >= stats.total
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  生成证明材料清单
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
