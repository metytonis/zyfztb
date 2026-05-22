import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const filePath = `/tmp/${sanitizedFileName}`;

    const fileStats = await stat(filePath);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
        'Content-Length': fileStats.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
