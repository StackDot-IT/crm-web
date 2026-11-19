// src/features/opportunities/components/OpportunityCard.jsx
import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, TrendingUp, Lock } from 'lucide-react';
import { useFormatters } from '../../../shared/hooks/useFormatters';
import { useAuth } from '../../../app/providers/AuthProvider';

/**
 * OpportunityCard — Presentational & sortable card for Kanban board
 */
export const OpportunityCard = ({ opportunity, onClick, isOverlay = false }) => {
  const { formatCurrency, formatDate } = useFormatters();
  const { user } = useAuth();
  const cardId = `card-${opportunity.id}`;

  const canMove = useMemo(() => {
    // Only WON (Closure) opportunities are locked from moving
    if (opportunity.status === 'WON') return false;
    if (!user) return false;
    const rank = Number(user.primaryRoleRank || 0);
    const isSuperAdmin = user.primaryRole === 'SUPER_ADMIN' || rank >= 100;
    if (isSuperAdmin) return true;

    const isCompanyAdmin = user.primaryRole === 'COMPANY_ADMIN' || rank >= 61;
    if (isCompanyAdmin) return true;

    const isBranchManager = (user.primaryRole === 'BRANCH_MANAGER' || (rank >= 41 && rank <= 60)) &&
      Number(user.branchId) === Number(opportunity.branchId);
    if (isBranchManager) return true;

    // Rep tier (ISE, BDE, custom rep): must be assigned owner
    return Number(opportunity.ownerId) === Number(user.id);
  }, [opportunity, user]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cardId,
    data: { type: 'card', opportunity },
    disabled: !canMove,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canMove ? attributes : {})}
      {...(canMove ? listeners : {})}
      onClick={() => onClick && onClick(opportunity)}
      className={`bg-white rounded-lg border border-slate-200/90 p-2.5 shadow-xs transition-all select-none group relative hover:border-slate-300 ${
        canMove ? 'cursor-pointer hover:shadow-sm' : 'cursor-pointer'
      } ${
        isOverlay ? 'shadow-lg rotate-1 scale-102 ring-2 ring-primary/30 cursor-grabbing bg-white' : ''
      }`}
    >
      {/* Top Meta Row: ID, Score & Stage */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100/70 px-1 py-0.5 rounded">
            OPP-{opportunity.id}
          </span>
          {(opportunity.qualificationScore != null || opportunity.lead?.qualificationScore != null) && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
              {opportunity.qualificationScore ?? opportunity.lead?.qualificationScore}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!canMove && opportunity.status === 'OPEN' && (
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
              title={`Assigned to ${opportunity.owner?.name || 'another user'}`}
            >
              <Lock className="w-2.5 h-2.5" />
            </span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
            {opportunity.stage?.name || 'In Progress'}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors" title={opportunity.title || opportunity.opportunityName}>
        {opportunity.title || opportunity.opportunityName}
      </h4>

      {/* Lead / Customer Info */}
      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-600 mb-2">
        <div className="flex items-center gap-1 min-w-0 truncate">
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate font-medium">{opportunity.lead?.name || 'Unassigned Lead'}</span>
        </div>
        {(opportunity.lead?.leadNumber || opportunity.lead?.id) && (
          <span className="text-[9px] font-mono font-semibold text-slate-400 shrink-0">
            {opportunity.lead?.leadNumber || `#${opportunity.lead?.id}`}
          </span>
        )}
      </div>

      {/* Attribution Compact Bar: Created By & Assigned To in 1 line */}
      <div className="flex items-center justify-between gap-1 px-1.5 py-1 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-500 mb-2">
        <div className="truncate max-w-[48%]" title={`Created by: ${opportunity.createdBy?.name || 'System'}`}>
          <span className="text-slate-400 mr-0.5">By:</span>
          <span className="font-medium text-slate-700">{opportunity.createdBy?.name?.split(' ')[0] || 'System'}</span>
        </div>
        <div className="truncate max-w-[48%] text-right" title={`Assigned to: ${opportunity.owner?.name || 'Unassigned'}`}>
          <span className="text-slate-400 mr-0.5">To:</span>
          <span className="font-semibold text-primary">{opportunity.owner?.name?.split(' ')[0] || 'Unassigned'}</span>
        </div>
      </div>

      {/* Footer: Revenue + Probability + Closing Date */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
        <span className="font-bold text-emerald-600 font-mono text-xs">
          {formatCurrency(opportunity.expectedRevenue)}
        </span>

        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-0.5 text-slate-500 font-medium" title="Win Probability">
            <TrendingUp className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{opportunity.probabilityPercentage || 10}%</span>
          </div>

          <div className="flex items-center gap-0.5" title="Closing Date">
            <Calendar className="w-2.5 h-2.5 shrink-0" />
            <span>{formatDate(opportunity.closingDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
