import { prisma } from '@/lib/prisma';
import { News } from '@prisma/client';

export interface NewsListOptions {
  take?: number;
  skip?: number;
  category?: string;
}

/**
 * ニュース一覧を取得
 * @param options - 取得オプション（件数、スキップ、カテゴリフィルター）
 * @returns ニュース配列
 */
export async function getNewsList(
  options: NewsListOptions = {}
): Promise<News[]> {
  const { take, skip, category } = options;

  try {
    const news = await prisma.news.findMany({
      where: category ? { category } : undefined,
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
    });
    return news;
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return [];
  }
}

/**
 * 最新ニュースを取得（トップページ用）
 * @param count - 取得件数（デフォルト: 3件）
 * @returns ニュース配列
 */
export async function getLatestNews(count: number = 3): Promise<News[]> {
  return getNewsList({ take: count });
}

/**
 * ニュース詳細を取得
 * @param id - ニュースID
 * @returns ニュース詳細 or null
 */
export async function getNewsById(id: number): Promise<News | null> {
  try {
    const news = await prisma.news.findUnique({
      where: { id },
    });
    return news;
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return null;
  }
}

