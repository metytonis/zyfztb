import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 确保上传目录存在
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = join(UPLOAD_DIR, safeFileName);

    // 写入文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 构造文件 URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const fileUrl = `${protocol}://${host}/uploads/${safeFileName}`;

    console.log('[File Upload] File saved:', {
      name: file.name,
      type: file.type,
      size: file.size,
      url: fileUrl,
    });

    return NextResponse.json({
      success: true,
      fileName: safeFileName,
      originalName: file.name,
      fileUrl: fileUrl,
      size: file.size,
    });

  } catch (error) {
    console.error('[File Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: String(error) },
      { status: 500 }
    );
  }
}
