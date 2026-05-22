import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { generateWordDocument, ReviewData } from '@/lib/docxGenerator';
import { z } from 'zod';

const ParameterSchema = z.object({
  id: z.string(),
  originalText: z.string(),
  aiProductModel: z.string().optional(),
  aiParamValue: z.string().optional(),
  manualRating: z.string(),
  aiRating: z.string(),
  evidenceType: z.string().optional(),
  certificateNo: z.string().optional(),
  manualComment: z.string().optional(),
});

const QualificationSchema = z.object({
  id: z.string(),
  originalText: z.string(),
  manualRating: z.string(),
  aiRating: z.string(),
  evidenceType: z.string().optional(),
  certificateNo: z.string().optional(),
  manualComment: z.string().optional(),
});

const UnmatchedSchema = z.object({
  id: z.string(),
  itemType: z.string(),
  itemName: z.string(),
  rating: z.string(),
  suggestedAction: z.string(),
});

const ProjectInfoSchema = z.object({
  projectName: z.string(),
  bidDeadline: z.string(),
  budget: z.number(),
  location: z.string(),
  tenderee: z.string(),
});

const ReviewDataSchema = z.object({
  parameters: z.array(ParameterSchema),
  qualifications: z.array(QualificationSchema),
  unmatched: z.array(UnmatchedSchema),
  projectInfo: ProjectInfoSchema,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ReviewDataSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.errors },
        { status: 400 }
      );
    }

    const reviewData: ReviewData = result.data;
    const buffer = await generateWordDocument(reviewData);

    const fileName = `analysis_report_${Date.now()}.docx`;
    const filePath = `/tmp/${fileName}`;

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/download?file=${encodeURIComponent(fileName)}`,
    });
  } catch (error) {
    console.error('Error generating Word document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
