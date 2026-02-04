import { useEffect, useState } from 'react';
import { fetchHoldingStocks } from '../services/fundApi';
import type { HoldingStock } from '../types';

interface HoldingStocksProps {
  fundCode: string;
}

export function HoldingStocks({ fundCode }: HoldingStocksProps) {
  const [stocks, setStocks] = useState<HoldingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHoldingStocks(fundCode).then((data) => {
      setStocks(data);
      setLoading(false);
    });
  }, [fundCode]);

  if (loading) {
    return <div className="text-center py-4 text-gray-500 text-sm">加载中...</div>;
  }

  if (stocks.length === 0) {
    return <div className="text-center py-4 text-gray-500 text-sm">暂无重仓股数据</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs">
            <th className="text-left py-2 font-normal">股票名称</th>
            <th className="text-right py-2 font-normal">持仓占比</th>
            <th className="text-right py-2 font-normal">较上期</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={index} className="border-t border-gray-100">
              <td className="py-2">
                <div className="font-medium">{stock.name}</div>
                <div className="text-xs text-gray-400">{stock.code}</div>
              </td>
              <td className="text-right py-2">{stock.ratio}</td>
              <td className="text-right py-2">
                <span className={
                  stock.change.includes('↑') || stock.change.includes('新增')
                    ? 'text-red-500'
                    : stock.change.includes('↓')
                    ? 'text-green-500'
                    : 'text-gray-500'
                }>
                  {stock.change}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
