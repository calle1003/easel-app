import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.json(
        { error: 'Data parameter is required' },
        { status: 400 }
      );
    }

    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }

    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
