import { useEffect, useState } from 'react';
import { useFundStore } from './stores/fundStore';
import { ProfitSummary } from './components/ProfitSummary';
import { FundList } from './components/FundList';
import { FundDetail } from './components/FundDetail';
import { AddFundModal } from './components/AddFundModal';

function App() {
  const { init, refreshEstimates, selectedFund, selectFund, loading, exportData, importData } = useFundStore();
  const [showAddFund, setShowAddFund] = useState(false);

  useEffect(() => {
    init();
    // 每分钟刷新估值
    const timer = setInterval(refreshEstimates, 60000);
    return () => clearInterval(timer);
  }, [init, refreshEstimates]);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fund-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        await importData(text);
        alert('导入成功');
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto pb-20">
        {/* 头部 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-bold">基金估值</h1>
          <div className="flex gap-2">
            <button onClick={handleImport} className="text-sm text-gray-500">导入</button>
            <button onClick={handleExport} className="text-sm text-gray-500">导出</button>
            <button onClick={refreshEstimates} className="text-sm text-blue-500">刷新</button>
          </div>
        </div>

        {/* 收益概览 */}
        <div className="p-4">
          <ProfitSummary />
        </div>

        {/* 基金列表 */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">我的基金</h2>
            <button
              onClick={() => setShowAddFund(true)}
              className="text-sm text-blue-500"
            >
              + 添加基金
            </button>
          </div>
          <FundList />
        </div>
      </div>

      {/* 基金详情 */}
      {selectedFund && <FundDetail onClose={() => selectFund(null)} />}

      {/* 添加基金弹窗 */}
      {showAddFund && <AddFundModal onClose={() => setShowAddFund(false)} />}
    </div>
  );
}

export default App;