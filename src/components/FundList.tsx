import { useFundStore } from '../stores/fundStore';
import type { FundEstimate, Position } from '../types';

interface FundItemProps {
  position?: Position;
  estimate?: FundEstimate;
  code: string;
  name: string;
  onSelect: () => void;
  onRemove: () => void;
}

function FundItem({ position, estimate, code, name, onSelect, onRemove }: FundItemProps) {
  const rate = estimate ? parseFloat(estimate.estimateRate) : 0;
  const isUp = rate >= 0;

  const profit = position && estimate
    ? position.shares * estimate.estimateValue - position.cost
    : 0;

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{code}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-gray-400 hover:text-red-500 text-sm"
        >
          删除
        </button>
      </div>

      {estimate && (
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-gray-500">估值</div>
            <div className={`text-lg font-semibold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
              {estimate.estimateValue.toFixed(4)}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
              {isUp ? '+' : ''}{estimate.estimateRate}%
            </div>
            <div className="text-xs text-gray-500">{estimate.estimateTime}</div>
          </div>
        </div>
      )}

      {position && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-gray-500">持有份额</div>
            <div className="font-medium">{position.shares.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">持仓成本</div>
            <div className="font-medium">¥{position.cost.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-500">持仓收益</div>
            <div className={`font-medium ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FundList() {
  const { positions, watchlist, estimates, selectFund, removeFund } = useFundStore();

  // 合并持仓和自选
  const allFunds = new Map<string, { code: string; name: string; position?: Position }>();

  positions.forEach((p) => {
    allFunds.set(p.fundCode, { code: p.fundCode, name: p.fundName, position: p });
  });

  watchlist.forEach((w) => {
    if (!allFunds.has(w.code)) {
      allFunds.set(w.code, { code: w.code, name: w.name });
    }
  });

  const fundList = Array.from(allFunds.values());

  if (fundList.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div>暂无基金，点击上方添加</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fundList.map((fund) => (
        <FundItem
          key={fund.code}
          code={fund.code}
          name={fund.name}
          position={fund.position}
          estimate={estimates.get(fund.code)}
          onSelect={() => selectFund(fund.code)}
          onRemove={() => removeFund(fund.code)}
        />
      ))}
    </div>
  );
}
