import { useFundStore } from '../stores/fundStore';

export function ProfitSummary() {
  const { profitStats, positions } = useFundStore();

  const formatMoney = (n: number) =>
    n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);

  const formatRate = (n: number) =>
    n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
      <div className="text-sm opacity-80 mb-1">总资产</div>
      <div className="text-3xl font-bold mb-4">
        ¥{profitStats.totalValue.toFixed(2)}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="opacity-70">持仓收益</div>
          <div className={`font-semibold ${profitStats.totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatMoney(profitStats.totalProfit)}
          </div>
          <div className={`text-xs ${profitStats.totalProfitRate >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatRate(profitStats.totalProfitRate)}
          </div>
        </div>

        <div>
          <div className="opacity-70">今日收益</div>
          <div className={`font-semibold ${profitStats.todayProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {formatMoney(profitStats.todayProfit)}
          </div>
        </div>

        <div>
          <div className="opacity-70">持仓基金</div>
          <div className="font-semibold">{positions.length} 只</div>
        </div>
      </div>
    </div>
  );
}
