import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const codes = await prisma.exchangeCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error('Failed to fetch exchange codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body.code || `EXCHANGE${Date.now()}`;

    const exchangeCode = await prisma.exchangeCode.create({
      data: {
        code: code.toUpperCase(),
        performerName: body.performerName,
      },
    });

    return NextResponse.json(exchangeCode, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このコードは既に存在します' },
        { status: 400 }
      );
    }
    console.error('Failed to create exchange code:', error);
    return NextResponse.json(
      { error: 'Failed to create exchange code' },
      { status: 500 }
    );
  }
}
