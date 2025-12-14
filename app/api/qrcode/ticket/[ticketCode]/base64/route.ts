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
      return NextResponse.json(
        { error: 'チケットが見つかりません' },
        { status: 404 }
      );
    }

    // QRコードをBase64形式で生成
    const qrCodeBase64 = await QRCode.toDataURL(ticketCode, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({
      ticketCode,
      ticketType: ticket.ticketType,
      isUsed: ticket.isUsed,
      qrCode: qrCodeBase64,
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return NextResponse.json(
      { error: 'QRコードの生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
