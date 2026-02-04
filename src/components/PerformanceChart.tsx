import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchPerformance } from '../services/fundApi';
import { useFundStore } from '../stores/fundStore';
import type { PerformancePoint, Transaction } from '../types';

interface PerformanceChartProps {
  fundCode: string;
  fundName: string;
}

const periods = [
  { key: '1m', label: '近1月' },
  { key: '3m', label: '近3月' },
  { key: '6m', label: '近6月' },
  { key: '1y', label: '近1年' },
  { key: '3y', label: '近3年' },
];

export function PerformanceChart({ fundCode, fundName }: PerformanceChartProps) {
  const [data, setData] = useState<PerformancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3m');
  const { transactions } = useFundStore();

  // 获取该基金的交易记录
  const fundTxs = transactions.filter((t) => t.fundCode === fundCode);

  useEffect(() => {
    setLoading(true);
    fetchPerformance(fundCode, period).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [fundCode, period]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>;
  }

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">暂无数据</div>;
  }

  // 计算涨幅百分比（相对于第一天）
  const firstValue = data[0]?.fundValue || 1;
  const chartData = data.map((d) => ({
    date: d.date,
    value: ((d.fundValue - firstValue) / firstValue * 100).toFixed(2),
    netValue: d.fundValue,
  }));

  const lastValue = parseFloat(chartData[chartData.length - 1]?.value || '0');

  // 创建日期到索引的映射
  const dateIndexMap = new Map<string, number>();
  chartData.forEach((d, i) => dateIndexMap.set(d.date, i));

  // 生成交易标记点
  const buyMarkers: Array<{ coord: [number, number]; value: string; tx: Transaction }> = [];
  const sellMarkers: Array<{ coord: [number, number]; value: string; tx: Transaction }> = [];

  fundTxs.forEach((tx) => {
    const idx = dateIndexMap.get(tx.date);
    if (idx !== undefined) {
      const marker = {
        coord: [idx, parseFloat(chartData[idx].value)],
        value: `¥${tx.amount.toFixed(0)}`,
        tx,
      };
      if (tx.type === 'buy') {
        buyMarkers.push(marker);
      } else {
        sellMarkers.push(marker);
      }
    }
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValue: string; value: string; seriesName: string; data: { tx?: Transaction } }>) => {
        const p = params[0];
        let result = `${p.axisValue}<br/>涨幅: ${p.value}%`;
        // 检查是否有交易
        const tx = fundTxs.find((t) => t.date === p.axisValue);
        if (tx) {
          result += `<br/><span style="color:${tx.type === 'buy' ? '#ef4444' : '#22c55e'}">${tx.type === 'buy' ? '买入' : '卖出'}: ¥${tx.amount.toFixed(2)}</span>`;
        }
        return result;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.date),
      axisLabel: { fontSize: 10, interval: Math.floor(chartData.length / 5) },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        name: '涨幅',
        data: chartData.map((d) => d.value),
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: lastValue >= 0 ? '#ef4444' : '#22c55e', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: lastValue >= 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)' },
              { offset: 1, color: lastValue >= 0 ? 'rgba(239, 68, 68, 0.02)' : 'rgba(34, 197, 94, 0.02)' },
            ],
          },
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 12,
          data: [
            ...buyMarkers.map((m) => ({
              coord: m.coord,
              itemStyle: { color: '#ef4444' },
              label: { show: false },
            })),
            ...sellMarkers.map((m) => ({
              coord: m.coord,
              itemStyle: { color: '#22c55e' },
              label: { show: false },
            })),
          ],
        },
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">
          <span className="text-gray-500">{fundName}</span>
          <span className={`ml-2 font-medium ${lastValue >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {lastValue >= 0 ? '+' : ''}{lastValue}%
          </span>
        </div>
        {(buyMarkers.length > 0 || sellMarkers.length > 0) && (
          <div className="flex items-center gap-3 text-xs">
            {buyMarkers.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-gray-500">买入</span>
              </span>
            )}
            {sellMarkers.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-gray-500">卖出</span>
              </span>
            )}
          </div>
        )}
      </div>

      <ReactECharts option={option} style={{ height: '220px' }} />

      <div className="flex justify-center gap-2 mt-2">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1 text-xs rounded-full ${
              period === p.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
