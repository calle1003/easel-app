import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { codes } = await request.json();

    if (!Array.isArray(codes)) {
      return NextResponse.json(
        { error: 'Codes must be an array' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      codes.map(async (code: string) => {
        const normalizedCode = code.trim().toUpperCase();
        const exchangeCode = await prisma.exchangeCode.findUnique({
          where: { code: normalizedCode },
        });

        return {
          code: normalizedCode,
          valid: !!exchangeCode,
          used: exchangeCode?.isUsed || false,
          performerName: exchangeCode?.performerName,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Failed to validate exchange codes:', error);
    return NextResponse.json(
      { error: 'Failed to validate exchange codes' },
      { status: 500 }
    );
  }
}
