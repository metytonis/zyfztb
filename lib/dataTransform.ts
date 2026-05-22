import type { ApiResponse, FinalJson, ProjectInfo, ReviewItem, UnmatchedItem, ReviewRow, Rating, ItemType } from '@/types'

export function transformApiResponse(response: ApiResponse): FinalJson {
  const projectInfo = response.projectInfo || response.project_info || {
    projectName: '',
    bidDeadline: '',
    budget: 0,
    location: '',
    tenderee: ''
  }

  // 处理参数相关
  const paramReview = (response.parameters || response.param_review || []).map((item: any) => ({
    itemName: item.paramName || item.itemName || item.name || '',
    rating: (item.manualRating || item.rating || '知识库未匹配') as Rating,
    matchDetails: item.matchDetails || item.description || '',
    productModel: item.productModel || item.model || undefined
  }))

  // 处理资质相关
  const qualReview = (response.qualifications || response.qual_review || []).map((item: any) => ({
    itemName: item.qualName || item.itemName || item.name || '',
    rating: (item.manualRating || item.rating || '知识库未匹配') as Rating,
    matchDetails: item.matchDetails || item.description || '',
    productModel: item.productModel || undefined
  }))

  // 处理未匹配项
  const unmatchedList = (response.unmatched || response.unmatched_items || []).map((item: any) => ({
    itemType: (item.itemType || item.type || '参数') as ItemType,
    itemName: item.itemName || item.name || '',
    rating: (item.rating || '知识库未匹配') as Rating,
    suggestedAction: item.suggestedAction || item.suggestion || ''
  }))

  // 生成 paramList 和 qualList 从 review 数据
  const paramList = paramReview.map(item => ({
    paramName: item.itemName,
    paramValue: item.matchDetails,
    required: true
  }))

  const qualList = qualReview.map(item => ({
    qualName: item.itemName,
    qualLevel: item.matchDetails,
    required: true
  }))

  return {
    projectInfo,
    paramList,
    qualList,
    paramReview,
    qualReview,
    unmatchedList
  }
}

export function generateReviewRows(finalJson: FinalJson): ReviewRow[] {
  const rows: ReviewRow[] = []

  // 处理参数
  finalJson.paramList.forEach((param, idx) => {
    const review = finalJson.paramReview.find(r => r.itemName === param.paramName) || {
      rating: '知识库未匹配' as Rating,
      matchDetails: '',
      productModel: undefined
    }
    rows.push({
      id: `param-${idx}`,
      itemType: '参数',
      originalText: `${param.paramName}: ${param.paramValue}`,
      aiRating: review.rating,
      aiProductModel: review.productModel,
      aiParamValue: param.paramValue,
      aiMatchDetails: review.matchDetails,
      manualRating: null,
      manualComment: null,
      status: 'pending_confirm'
    })
  })

  // 处理资质
  finalJson.qualList.forEach((qual, idx) => {
    const review = finalJson.qualReview.find(r => r.itemName === qual.qualName) || {
      rating: '知识库未匹配' as Rating,
      matchDetails: '',
      productModel: undefined
    }
    rows.push({
      id: `qual-${idx}`,
      itemType: '资质',
      originalText: `${qual.qualName}: ${qual.qualLevel}`,
      aiRating: review.rating,
      aiProductModel: review.productModel,
      aiMatchDetails: review.matchDetails,
      manualRating: null,
      manualComment: null,
      status: 'pending_confirm'
    })
  })

  return rows
}
