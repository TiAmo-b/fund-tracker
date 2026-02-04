import { useState } from 'react';
import { useFundStore } from '../stores/fundStore';
import { searchFund } from '../services/fundApi';

interface AddFundModalProps {
  onClose: () => void;
}

export function AddFundModal({ onClose }: AddFundModalProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Array<{ code: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);
  const { addFund } = useFundStore();

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    const data = await searchFund(keyword);
    setResults(data.slice(0, 10));
    setSearching(false);
  };

  const handleAdd = async (code: string, name: string) => {
    await addFund(code, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入基金代码或名称"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              输入基金代码或名称搜索
            </div>
          ) : (
            <div className="divide-y">
              {results.map((fund) => (
                <div
                  key={fund.code}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => handleAdd(fund.code, fund.name)}
                >
                  <div>
                    <div className="font-medium">{fund.name}</div>
                    <div className="text-sm text-gray-500">{fund.code}</div>
                  </div>
                  <button className="text-blue-500 text-sm">添加</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
