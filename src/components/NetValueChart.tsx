import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchNetValueHistory } from '../services/fundApi';
import type { NetValueHistory } from '../types';

interface NetValueChartProps {
  fundCode: string;
  fundName: string;
}

export function NetValueChart({ fundCode, fundName }: NetValueChartProps) {
  const [history, setHistory] = useState<NetValueHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNetValueHistory(fundCode, 1, 60).then((data) => {
      setHistory(data.reverse());
      setLoading(false);
    });
  }, [fundCode]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        加载中...
      </div>
    );
  }

  const option = {
    title: {
      text: `${fundName} 净值走势`,
      textStyle: { fontSize: 14, fontWeight: 'normal' },
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValue: string; value: number }>) => {
        const p = params[0];
        return `${p.axisValue}<br/>净值: ${p.value.toFixed(4)}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: history.map((h) => h.date),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        data: history.map((h) => h.netValue),
        type: 'line',
        smooth: true,
        lineStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '250px' }} />;
}
