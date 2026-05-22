export interface TenderData {
  id: string
  title: string
  category: string
  budget: number
  deadline: string
  requirements: string[]
  evaluationCriteria: string[]
  documents: string[]
  createdAt: string
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  progress: number
  status: 'uploading' | 'completed' | 'error' | 'analyzing'
  error?: string
}

export interface AnalyzeResult {
  success: boolean
  data?: TenderData
  message?: string
}

export type Rating = '完全满足' | '部分满足' | '不满足' | '知识库未匹配'
export type ItemType = '参数' | '资质'

export interface ProjectInfo {
  projectName: string
  bidDeadline: string
  budget: number
  location: string
  tenderee: string
}

export interface ParamItem {
  paramName: string
  paramValue: string
  required: boolean
}

export interface QualItem {
  qualName: string
  qualLevel: string
  required: boolean
}

export interface ReviewItem {
  itemName: string
  rating: Rating
  matchDetails: string
  productModel?: string
}

export interface UnmatchedItem {
  itemType: ItemType
  itemName: string
  rating: Rating
  suggestedAction: string
}

export interface ReviewRow {
  id: string
  itemType: ItemType
  originalText: string
  aiRating: Rating
  aiProductModel?: string
  aiParamValue?: string
  aiMatchDetails: string
  manualRating: Rating | null
  manualComment: string | null
  status: 'pending_confirm' | 'confirmed'
}

export interface FinalJson {
  projectInfo: ProjectInfo
  paramList: ParamItem[]
  qualList: QualItem[]
  paramReview: ReviewItem[]
  qualReview: ReviewItem[]
  unmatchedList: UnmatchedItem[]
}

export interface ApiResponse {
  project_info?: ProjectInfo
  projectInfo?: ProjectInfo
  parameters?: any[]
  param_review?: any[]
  qualifications?: any[]
  qual_review?: any[]
  unmatched?: any[]
  unmatched_items?: any[]
  summary?: any
  error?: string
  detail?: string
}
