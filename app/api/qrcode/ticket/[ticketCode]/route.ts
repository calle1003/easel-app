import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketCode: string }> }
) {
  try {
    const { ticketCode } = await params;

    // チケットの存在確認
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
    });

    if (!ticket) {
      return new NextResponse('チケットが見つかりません', { status: 404 });
    }

    // QRコードを生成（PNG形式）
    const qrCodeBuffer = await QRCode.toBuffer(ticketCode, {
      width: 300,
      margin: 2,
    });

    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return new NextResponse('QRコードの生成に失敗しました', { status: 500 });
  }
}
