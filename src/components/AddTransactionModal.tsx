import { useState } from 'react';
import { useFundStore } from '../stores/fundStore';
import dayjs from 'dayjs';

interface AddTransactionModalProps {
  fundCode: string;
  onClose: () => void;
}

export function AddTransactionModal({ fundCode, onClose }: AddTransactionModalProps) {
  const { estimates, addTransaction } = useFundStore();
  const estimate = estimates.get(fundCode);

  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [netValue, setNetValue] = useState(estimate?.netValue.toString() || '');
  const [fee, setFee] = useState('0');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    const netValueNum = parseFloat(netValue);
    const feeNum = parseFloat(fee) || 0;

    if (!amountNum || !netValueNum) {
      alert('请填写金额和净值');
      return;
    }

    const shares = amountNum / netValueNum;

    await addTransaction({
      fundCode,
      type,
      amount: amountNum,
      shares,
      netValue: netValueNum,
      fee: feeNum,
      date,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">记录交易</h3>
          <p className="text-sm text-gray-500">{estimate?.name || fundCode}</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setType('buy')}
              className={`flex-1 py-2 rounded-lg font-medium ${
                type === 'buy' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              买入
            </button>
            <button
              onClick={() => setType('sell')}
              className={`flex-1 py-2 rounded-lg font-medium ${
                type === 'sell' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              卖出
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">交易金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">成交净值</label>
            <input
              type="number"
              value={netValue}
              onChange={(e) => setNetValue(e.target.value)}
              placeholder="输入净值"
              step="0.0001"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">手续费</label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">交易日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {amount && netValue && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <span className="text-gray-600">预计份额：</span>
              <span className="font-medium">
                {(parseFloat(amount) / parseFloat(netValue)).toFixed(2)} 份
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
