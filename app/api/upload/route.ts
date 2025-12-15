import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// ファイルアップロード用のルート設定
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック (15MB制限)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（最大15MB）' },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '画像ファイルのみアップロード可能です（JPEG, PNG, GIF, WebP）' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名を生成（タイムスタンプ + オリジナルファイル名）
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;

    // public/uploads/flyersに保存
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'flyers');
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    // 公開URLを返す
    const publicUrl = `/uploads/flyers/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
