/**
 * News ページの型定義
 */

export interface News {
  id: number;
  title: string;
  content: string;
  publishedAt: Date;
  category: string | null;
}

export interface NewsFormData {
  title: string;
  content: string;
  category: string;
}
