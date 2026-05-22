"use client"
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { TenderData, UploadedFile, FinalJson, ReviewRow } from '@/types'

interface TenderContextType {
  tenderData: TenderData | null
  setTenderData: (data: TenderData | null) => void
  uploadedFiles: UploadedFile[]
  addUploadedFile: (file: UploadedFile) => void
  updateFileProgress: (id: string, progress: number) => void
  updateFileStatus: (id: string, status: UploadedFile['status']) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  finalJson: FinalJson | null
  setFinalJson: (data: FinalJson | null) => void
  reviewRows: ReviewRow[]
  setReviewRows: (rows: ReviewRow[]) => void
  updateReviewRow: (id: string, updates: Partial<ReviewRow>) => void
}

const TenderContext = createContext<TenderContextType | undefined>(undefined)

export function TenderProvider({ children }: { children: ReactNode }) {
  const [tenderData, setTenderData] = useState<TenderData | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [finalJson, setFinalJson] = useState<FinalJson | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([])

  const addUploadedFile = useCallback((file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file])
  }, [])

  const updateFileProgress = useCallback((id: string, progress: number) => {
    setUploadedFiles(prev =>
      prev.map(file =>
        file.id === id ? { ...file, progress } : file
      )
    )
  }, [])

  const updateFileStatus = useCallback((id: string, status: UploadedFile['status']) => {
    setUploadedFiles(prev =>
      prev.map(file =>
        file.id === id ? { ...file, status } : file
      )
    )
  }, [])

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
  }, [])

  const clearFiles = useCallback(() => {
    setUploadedFiles([])
  }, [])

  const updateReviewRow = useCallback((id: string, updates: Partial<ReviewRow>) => {
    setReviewRows(prev =>
      prev.map(row =>
        row.id === id ? { ...row, ...updates } : row
      )
    )
  }, [])

  return (
    <TenderContext.Provider
      value={{
        tenderData,
        setTenderData,
        uploadedFiles,
        addUploadedFile,
        updateFileProgress,
        updateFileStatus,
        removeFile,
        clearFiles,
        finalJson,
        setFinalJson,
        reviewRows,
        setReviewRows,
        updateReviewRow,
      }}
    >
      {children}
    </TenderContext.Provider>
  )
}

export function useTender() {
  const context = useContext(TenderContext)
  if (context === undefined) {
    throw new Error('useTender must be used within a TenderProvider')
  }
  return context
}