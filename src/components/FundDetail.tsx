import { useFundStore } from '../stores/fundStore';
import { PerformanceChart } from './PerformanceChart';
import { RealtimeChart } from './RealtimeChart';
import { HoldingStocks } from './HoldingStocks';
import { AddTransactionModal } from './AddTransactionModal';
import { useState } from 'react';

interface FundDetailProps {
  onClose: () => void;
}

type TabType = 'overview' | 'performance' | 'holdings';

export function FundDetail({ onClose }: FundDetailProps) {
  const { selectedFund, estimates, positions, transactions } = useFundStore();
  const [showAddTx, setShowAddTx] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!selectedFund) return null;

  const estimate = estimates.get(selectedFund);
  const position = positions.find((p) => p.fundCode === selectedFund);
  const fundTxs = transactions
    .filter((t) => t.fundCode === selectedFund)
    .sort((a, b) => b.createdAt - a.createdAt);

  const tabs = [
    { key: 'overview' as TabType, label: '概览' },
    { key: 'performance' as TabType, label: '业绩走势' },
    { key: 'holdings' as TabType, label: '重仓股' },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={onClose} className="text-blue-500">返回</button>
          <div className="text-center">
            <h2 className="font-semibold">{estimate?.name || selectedFund}</h2>
            <div className="text-xs text-gray-500">{selectedFund}</div>
          </div>
          <button onClick={() => setShowAddTx(true)} className="text-blue-500">记账</button>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-t">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* 估值信息 - 始终显示 */}
        {estimate && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">估值</div>
                <div className="text-2xl font-bold">{estimate.estimateValue.toFixed(4)}</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${parseFloat(estimate.estimateRate) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(estimate.estimateRate) >= 0 ? '+' : ''}{estimate.estimateRate}%
                </div>
                <div className="text-xs text-gray-500">{estimate.estimateTime}</div>
              </div>
            </div>
          </div>
        )}

        {/* 概览 Tab */}
        {activeTab === 'overview' && (
          <>
            {/* 实时走势图 */}
            {estimate && (
              <div className="bg-white border rounded-xl p-4 mb-4">
                <RealtimeChart
                  fundCode={selectedFund}
                  estimateRate={estimate.estimateRate}
                />
              </div>
            )}

            {position && (
              <div className="bg-white border rounded-xl p-4 mb-4">
                <h3 className="font-medium mb-3">持仓信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">持有份额</div>
                    <div className="font-medium">{position.shares.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">持仓成本</div>
                    <div className="font-medium">¥{position.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">成本单价</div>
                    <div className="font-medium">{position.avgCost.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">当前市值</div>
                    <div className="font-medium">
                      ¥{estimate ? (position.shares * estimate.estimateValue).toFixed(2) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fundTxs.length > 0 && (
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-medium mb-3">交易记录</h3>
                <div className="space-y-2">
                  {fundTxs.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <span className={`text-sm font-medium ${tx.type === 'buy' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'buy' ? '买入' : '卖出'}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">{tx.date}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">¥{tx.amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{tx.shares.toFixed(2)}份 @ {tx.netValue.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 业绩走势 Tab */}
        {activeTab === 'performance' && (
          <div className="bg-white border rounded-xl p-4">
            <PerformanceChart fundCode={selectedFund} fundName={estimate?.name || ''} />
          </div>
        )}

        {/* 重仓股 Tab */}
        {activeTab === 'holdings' && (
          <div className="bg-white border rounded-xl p-4">
            <h3 className="font-medium mb-3">基金重仓股</h3>
            <HoldingStocks fundCode={selectedFund} />
          </div>
        )}
      </div>

      {showAddTx && (
        <AddTransactionModal fundCode={selectedFund} onClose={() => setShowAddTx(false)} />
      )}
    </div>
  );
}
