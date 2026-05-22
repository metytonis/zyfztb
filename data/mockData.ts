import type { FinalJson, ReviewRow } from '@/types'

const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_FINAL_JSON: FinalJson = {
  projectInfo: {
    projectName: '企业信息化系统升级项目',
    bidDeadline: deadline,
    budget: 5000000,
    location: '北京市海淀区',
    tenderee: '某大型国有企业',
  },
  paramList: [
    { paramName: '服务器CPU', paramValue: '不低于32核', required: true },
    { paramName: '内存容量', paramValue: '不低于256GB', required: true },
    { paramName: '存储容量', paramValue: '不低于10TB SSD', required: true },
    { paramName: '操作系统', paramValue: 'Linux', required: true },
    { paramName: '数据库', paramValue: 'MySQL 8.0+', required: false },
    { paramName: '响应时间', paramValue: '不超过100ms', required: true },
    { paramName: '并发用户数', paramValue: '不低于5000', required: true },
  ],
  qualList: [
    { qualName: 'ISO9001认证', qualLevel: '必须具备', required: true },
    { qualName: 'ISO27001认证', qualLevel: '必须具备', required: true },
    { qualName: 'CMMI等级', qualLevel: '至少CMMI3', required: true },
    { qualName: '软件企业认定', qualLevel: '需要', required: false },
  ],
  paramReview: [
    {
      itemName: '服务器CPU',
      rating: '完全满足',
      matchDetails: '产品型号：Dell PowerEdge R750，配置：2 x Intel Xeon Gold 6338，共64核',
      productModel: 'Dell PowerEdge R750',
    },
    {
      itemName: '内存容量',
      rating: '完全满足',
      matchDetails: '产品型号：Dell PowerEdge R750，配置：32 x 16GB DDR4 = 512GB',
      productModel: 'Dell PowerEdge R750',
    },
    {
      itemName: '存储容量',
      rating: '部分满足',
      matchDetails: '产品型号：Dell PowerEdge R750，配置：8 x 2TB SSD = 16TB，满足要求',
      productModel: 'Dell PowerEdge R750',
    },
    {
      itemName: '操作系统',
      rating: '完全满足',
      matchDetails: '预装 Ubuntu Server 22.04 LTS',
      productModel: 'Dell PowerEdge R750',
    },
    {
      itemName: '数据库',
      rating: '知识库未匹配',
      matchDetails: '知识库中未找到相关信息',
    },
    {
      itemName: '响应时间',
      rating: '部分满足',
      matchDetails: '产品文档显示平均响应时间为150ms，略高于要求的100ms',
      productModel: '某高性能服务器',
    },
    {
      itemName: '并发用户数',
      rating: '完全满足',
      matchDetails: '支持最高20000并发用户',
      productModel: '某高性能服务器',
    },
  ],
  qualReview: [
    {
      itemName: 'ISO9001认证',
      rating: '完全满足',
      matchDetails: '已具备ISO9001:2015认证，证书编号：XX-2023-XXXX',
    },
    {
      itemName: 'ISO27001认证',
      rating: '完全满足',
      matchDetails: '已具备ISO27001:2022认证，证书编号：XX-2023-XXXX',
    },
    {
      itemName: 'CMMI等级',
      rating: '部分满足',
      matchDetails: '当前为CMMI2级，正在申请CMMI3级，预计2个月内完成',
    },
    {
      itemName: '软件企业认定',
      rating: '不满足',
      matchDetails: '暂未获得软件企业认定',
    },
  ],
  unmatchedList: [
    {
      itemType: '参数',
      itemName: '数据库',
      rating: '知识库未匹配',
      suggestedAction: '建议向技术团队确认是否有MySQL数据库解决方案',
    },
    {
      itemType: '参数',
      itemName: '响应时间',
      rating: '部分满足',
      suggestedAction: '建议与客户沟通是否可接受150ms的响应时间',
    },
    {
      itemType: '资质',
      itemName: 'CMMI等级',
      rating: '部分满足',
      suggestedAction: '建议提供CMMI3级申请的证明文件',
    },
    {
      itemType: '资质',
      itemName: '软件企业认定',
      rating: '不满足',
      suggestedAction: '建议尽快申请软件企业认定',
    },
  ],
}

export function generateMockReviewRows(finalJson: FinalJson): ReviewRow[] {
  const rows: ReviewRow[] = []

  finalJson.paramList.forEach((param, idx) => {
    const review = finalJson.paramReview.find(r => r.itemName === param.paramName)
    rows.push({
      id: `param-${idx}`,
      itemType: '参数',
      originalText: `${param.paramName}: ${param.paramValue}`,
      aiRating: review?.rating || '知识库未匹配',
      aiProductModel: review?.productModel,
      aiParamValue: param.paramValue,
      aiMatchDetails: review?.matchDetails || '无',
      manualRating: null,
      manualComment: null,
      status: 'pending_confirm',
    })
  })

  finalJson.qualList.forEach((qual, idx) => {
    const review = finalJson.qualReview.find(r => r.itemName === qual.qualName)
    rows.push({
      id: `qual-${idx}`,
      itemType: '资质',
      originalText: `${qual.qualName}: ${qual.qualLevel}`,
      aiRating: review?.rating || '知识库未匹配',
      aiMatchDetails: review?.matchDetails || '无',
      manualRating: null,
      manualComment: null,
      status: 'pending_confirm',
    })
  })

  return rows
}
