import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);
    const body = await request.json();

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const news = await prisma.news.update({
      where: { id: newsId },
      data: {
        title: body.title,
        content: body.content,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        category: body.category,
      },
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Failed to update news:', error);
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const newsId = parseInt(id);

    if (isNaN(newsId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.news.delete({
      where: { id: newsId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete news:', error);
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    );
  }
}
