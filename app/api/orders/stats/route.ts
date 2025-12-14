import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      include: { tickets: true },
    });

    const totalOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalTickets = paidOrders.reduce(
      (sum, order) => sum + order.tickets.length,
      0
    );
    const discountedTickets = paidOrders.reduce(
      (sum, order) => sum + order.discountedGeneralCount,
      0
    );

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      totalTickets,
      discountedTickets,
    });
  } catch (error) {
    console.error('Failed to fetch order stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
