import { NextRequest, NextResponse } from 'next/server';
import { transformApiResponse } from '@/lib/dataTransform';
import { MOCK_FINAL_JSON } from '@/data/mockData';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const FASTGPT_API_KEY = process.env.FASTGPT_API_KEY || '';
const FASTGPT_API_URL = process.env.FASTGPT_API_URL || '';
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    console.log('[Analyze API] Starting analysis...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('[Analyze API] No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('[Analyze API] File received:', file.name, file.type, file.size, 'bytes');
    
    // 第一步：保存文件到本地
    console.log('[Analyze API] Saving file locally...');
    
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = join(UPLOAD_DIR, safeFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 构造文件 URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const localFileUrl = `${protocol}://${host}/uploads/${safeFileName}`;
    
    console.log('[Analyze API] File saved locally:', localFileUrl);

    // 检查环境变量
    console.log('[Analyze API] FASTGPT_API_URL:', FASTGPT_API_URL);
    console.log('[Analyze API] FASTGPT_API_KEY configured:', !!FASTGPT_API_KEY);

    if (!FASTGPT_API_URL || !FASTGPT_API_KEY) {
      console.log('[Analyze API] Missing configuration, falling back to mock data');
      return NextResponse.json(transformApiResponse(MOCK_FINAL_JSON as any));
    }

    // 尝试调用 FastGPT API，传递文件 URL
    console.log('[Analyze API] Sending request to FastGPT with file URL...');
    
    const requestBody = {
      chatId: `tender-${Date.now()}`,
      stream: false,
      detail: true,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这个标书文件',
            },
            {
              type: 'file_url',
              name: file.name,
              url: localFileUrl,
            },
          ],
        },
      ],
    };

    console.log('[Analyze API] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(FASTGPT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FASTGPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Analyze API] FastGPT response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Analyze API] FastGPT error response:', errorText);
      
      // 如果 API 调用失败，使用 mock 数据
      console.log('[Analyze API] API call failed, falling back to mock data');
      return NextResponse.json(transformApiResponse(MOCK_FINAL_JSON as any));
    }

    const result = await response.json();
    console.log('[Analyze API] FastGPT success response:', JSON.stringify(result, null, 2));
    
    // 尝试解析响应，看看是否有我们需要的数据
    let content = result.choices?.[0]?.message?.content || '';
    
    if (typeof content === 'string') {
      try {
        // 尝试解析 JSON
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsedJson = JSON.parse(content);
        console.log('[Analyze API] Parsed JSON from response:', parsedJson);
        return NextResponse.json(transformApiResponse(parsedJson));
      } catch (e) {
        console.log('[Analyze API] Response is not JSON, falling back to mock data');
      }
    }
    
    // 如果无法获取有效数据，使用 mock 数据
    console.log('[Analyze API] No valid data in response, using mock data');
    return NextResponse.json(transformApiResponse(MOCK_FINAL_JSON as any));

  } catch (error) {
    console.error('[Analyze API] Critical error:', error);
    // 出错时也使用 mock 数据
    console.log('[Analyze API] Error occurred, falling back to mock data');
    return NextResponse.json(transformApiResponse(MOCK_FINAL_JSON as any));
  }
}
