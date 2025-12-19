/**
 * 注文テーブルコンポーネント（tickets/orders共通）
 */

'use client';

import { useState } from 'react';
import { Check, X, Clock, RefreshCw, ChevronDown, ChevronUp, Eye, Gift, Ticket as TicketIcon } from 'lucide-react';
import { Order } from '../types';

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onStatusChange: (id: number, status: string) => Promise<void>;
}

export function OrderTable({ orders, loading, onStatusChange }: OrderTableProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-600 rounded font-medium">
            <Check size={12} />
            支払済
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded font-medium">
            <Clock size={12} />
            決済待ち
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-medium">
            <X size={12} />
            キャンセル
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-600 rounded font-medium">
            <RefreshCw size={12} />
            返金済
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-500">注文がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                注文ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                購入日時
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                顧客情報
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                公演日
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                購入枚数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                合計金額
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                詳細
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <>
                {/* Main Row */}
                <tr
                  key={order.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    expandedOrderId === order.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-700">#{order.id}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{formatShortDate(order.createdAt)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">
                      {order.performanceLabel || order.performanceDate}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">
                      {order.generalQuantity > 0 && <span>一般: {order.generalQuantity}枚</span>}
                      {order.generalQuantity > 0 && order.reservedQuantity > 0 && (
                        <span className="mx-1">/</span>
                      )}
                      {order.reservedQuantity > 0 && <span>指定: {order.reservedQuantity}枚</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        ¥{order.totalAmount.toLocaleString()}
                      </p>
                      {order.discountAmount > 0 && (
                        <p className="text-xs text-green-600">
                          -¥{order.discountAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Eye size={16} />
                      {expandedOrderId === order.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expanded Detail Row */}
                {expandedOrderId === order.id && (
                  <tr key={`${order.id}-detail`}>
                    <td colSpan={8} className="px-4 py-4 bg-slate-50 border-b border-slate-200">
                      <div className="space-y-4">
                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Customer Info */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
                              顧客情報
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p className="text-slate-700">{order.customerName}</p>
                              <p className="text-slate-500">{order.customerEmail}</p>
                              <p className="text-slate-500">{order.customerPhone}</p>
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
                              決済情報
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p className="text-slate-500">
                                一般席: {order.generalQuantity}枚 × ¥
                                {order.generalPrice.toLocaleString()}
                              </p>
                              {order.reservedQuantity > 0 && (
                                <p className="text-slate-500">
                                  指定席: {order.reservedQuantity}枚 × ¥
                                  {order.reservedPrice.toLocaleString()}
                                </p>
                              )}
                              {order.discountedGeneralCount > 0 && (
                                <p className="text-green-600">
                                  引換券適用: {order.discountedGeneralCount}枚
                                </p>
                              )}
                              {order.paidAt && (
                                <p className="text-slate-500">
                                  決済完了: {formatDate(order.paidAt)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
                              アクション
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {order.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => onStatusChange(order.id, 'PAID')}
                                    className="text-xs px-3 py-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                  >
                                    支払済にする
                                  </button>
                                  <button
                                    onClick={() => onStatusChange(order.id, 'CANCELLED')}
                                    className="text-xs px-3 py-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                                  >
                                    キャンセル
                                  </button>
                                </>
                              )}
                              {order.status === 'PAID' && (
                                <button
                                  onClick={() => onStatusChange(order.id, 'REFUNDED')}
                                  className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                >
                                  返金済にする
                                </button>
                              )}
                              {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
                                <span className="text-xs text-slate-400">操作なし</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Exchange Codes */}
                        {order.exchangeCodeList && order.exchangeCodeList.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-2">
                              <Gift size={14} />
                              使用した引換券
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {order.exchangeCodeList.map((code, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-mono"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tickets */}
                        {order.tickets && order.tickets.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-2">
                              <TicketIcon size={14} />
                              発行済みチケット ({order.tickets.length}枚)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {order.tickets.map((ticket) => (
                                <div
                                  key={ticket.id}
                                  className="p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                                >
                                  <p className="font-mono text-slate-700">{ticket.ticketCode}</p>
                                  <p className="text-slate-500">
                                    {ticket.ticketType === 'GENERAL' ? '一般席' : '指定席'}
                                  </p>
                                  {ticket.isUsed && (
                                    <span className="text-green-600 text-xs">✓ 使用済み</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
