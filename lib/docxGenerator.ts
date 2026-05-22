import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, ShadingType, HeadingLevel, SectionType, ISectionOptions } from 'docx';

export interface ParameterItem {
  id: string;
  originalText: string;
  aiProductModel?: string;
  aiParamValue?: string;
  manualRating: string;
  aiRating: string;
  evidenceType?: string;
  certificateNo?: string;
  manualComment?: string;
}

export interface QualificationItem {
  id: string;
  originalText: string;
  manualRating: string;
  aiRating: string;
  evidenceType?: string;
  certificateNo?: string;
  manualComment?: string;
}

export interface UnmatchedItem {
  id: string;
  itemType: string;
  itemName: string;
  rating: string;
  suggestedAction: string;
}

export interface ProjectInfo {
  projectName: string;
  bidDeadline: string;
  budget: number;
  location: string;
  tenderee: string;
}

export interface ReviewData {
  parameters: ParameterItem[];
  qualifications: QualificationItem[];
  unmatched: UnmatchedItem[];
  projectInfo: ProjectInfo;
}

const getRatingColor = (rating: string): string => {
  switch (rating) {
    case '完全满足':
      return 'C8E6C9';
    case '部分满足':
      return 'FFF9C4';
    default:
      return 'FFCDD2';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
};

export async function generateWordDocument(reviewData: ReviewData): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: '招标文件分析报告',
          heading: HeadingLevel.HEADING_1,
          alignment: 'center',
        }),
        new Paragraph({
          text: `项目名称：${reviewData.projectInfo.projectName}`,
        }),
        new Paragraph({
          text: `招标人：${reviewData.projectInfo.tenderee}`,
        }),
        new Paragraph({
          text: `开标地点：${reviewData.projectInfo.location}`,
        }),
        new Paragraph({
          text: `预算金额：${formatCurrency(reviewData.projectInfo.budget)}`,
        }),
        new Paragraph({
          text: `截止时间：${new Date(reviewData.projectInfo.bidDeadline).toLocaleDateString('zh-CN')}`,
        }),
        new Paragraph(''),
        new Paragraph({
          text: '产品参数匹配表',
          heading: HeadingLevel.HEADING_2,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('序号')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('标书参数原文')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('匹配产品')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('满足状态')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('证明类型')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('证书编号')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('备注')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
              ],
            }),
            ...reviewData.parameters.map((param, index) => {
              const rating = param.manualRating || param.aiRating;
              const productText = param.aiProductModel
                ? `${param.aiProductModel}${param.aiParamValue ? ` (${param.aiParamValue})` : ''}`
                : '-';
              
              return new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(String(index + 1))] }),
                  new TableCell({ children: [new Paragraph(param.originalText)] }),
                  new TableCell({ children: [new Paragraph(productText)] }),
                  new TableCell({
                    children: [new Paragraph(rating)],
                    shading: { fill: getRatingColor(rating), type: ShadingType.SOLID },
                  }),
                  new TableCell({ children: [new Paragraph(param.evidenceType || '-')] }),
                  new TableCell({ children: [new Paragraph(param.certificateNo || '-')] }),
                  new TableCell({ children: [new Paragraph(param.manualComment || '-')] }),
                ],
              });
            }),
          ],
        }),
        new Paragraph(''),
        new Paragraph({
          text: '资质证书匹配表',
          heading: HeadingLevel.HEADING_2,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('序号')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('资质要求')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('满足状态')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('证明类型')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('证书编号')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('备注')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
              ],
            }),
            ...reviewData.qualifications.map((qual, index) => {
              const rating = qual.manualRating || qual.aiRating;
              
              return new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(String(index + 1))] }),
                  new TableCell({ children: [new Paragraph(qual.originalText)] }),
                  new TableCell({
                    children: [new Paragraph(rating)],
                    shading: { fill: getRatingColor(rating), type: ShadingType.SOLID },
                  }),
                  new TableCell({ children: [new Paragraph(qual.evidenceType || '-')] }),
                  new TableCell({ children: [new Paragraph(qual.certificateNo || '-')] }),
                  new TableCell({ children: [new Paragraph(qual.manualComment || '-')] }),
                ],
              });
            }),
          ],
        }),
        new Paragraph(''),
        new Paragraph({
          text: '待补充材料清单',
          heading: HeadingLevel.HEADING_2,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph('类型')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('项目名称')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('当前状态')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
                new TableCell({
                  children: [new Paragraph('建议措施')],
                  shading: { fill: 'E8E8E8', type: ShadingType.SOLID },
                }),
              ],
            }),
            ...reviewData.unmatched.map((item) => {
              return new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(item.itemType)],
                    shading: { fill: 'FFCDD2', type: ShadingType.SOLID },
                  }),
                  new TableCell({
                    children: [new Paragraph(item.itemName)],
                    shading: { fill: 'FFCDD2', type: ShadingType.SOLID },
                  }),
                  new TableCell({
                    children: [new Paragraph(item.rating)],
                    shading: { fill: 'FFCDD2', type: ShadingType.SOLID },
                  }),
                  new TableCell({
                    children: [new Paragraph(item.suggestedAction)],
                    shading: { fill: 'FFCDD2', type: ShadingType.SOLID },
                  }),
                ],
              });
            }),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
