import React from 'react';
import { OrderStatus, ApplicationStatus, WithdrawalStatus, ProductStatus, PaymentStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus | ApplicationStatus | WithdrawalStatus | ProductStatus | PaymentStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Order Statuses
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ACCEPTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'PICKED_BY_SELLER':
        return 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ON_THE_WAY':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PAID':
      case 'APPROVED':
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'ARCHIVED':
        return 'bg-zinc-100 text-zinc-700 border-zinc-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()} ${className}`}
    >
      {formatText(status)}
    </span>
  );
};
