import { useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { fetchRealtimeTrend } from '../services/fundApi';
import type { RealtimePoint } from '../types';

interface RealtimeChartProps {
  fundCode: string;
  estimateRate: string;
}

// 判断是否在交易时间内
function isTradeTime(): boolean {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  return (time >= 9 * 60 + 30 && time <= 11 * 60 + 30) || (time >= 13 * 60 && time <= 15 * 60);
}

export function RealtimeChart({ fundCode, estimateRate }: RealtimeChartProps) {
  const [data, setData] = useState<RealtimePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [useImage, setUseImage] = useState(true); // 默认使用图片模式
  const [imageError, setImageError] = useState(false);

  const loadData = useCallback(async () => {
    const result = await fetchRealtimeTrend(fundCode);
    setData(result);
    setLoading(false);
  }, [fundCode]);

  useEffect(() => {
    loadData();
    // 交易时间内每30秒刷新
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  // 图片模式 - 使用天天基金的分时图
  if (useImage && !imageError) {
    const chartUrl = `https://j4.dfcfw.com/charts/pic6/${fundCode}.png?v=${Date.now()}`;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">今日实时走势</span>
          <button
            onClick={() => setUseImage(false)}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            切换到数据模式
          </button>
        </div>
        <div className="bg-white rounded overflow-hidden">
          <img
            src={chartUrl}
            alt="分时走势图"
            className="w-full h-auto"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">
          数据来源：天天基金
        </div>
      </div>
    );
  }

  // 数据模式 - 自累积数据
  if (loading) {
    return <div className="h-48 flex items-center justify-center text-gray-500 text-sm">加载中...</div>;
  }

  if (data.length === 0) {
    const inTradeTime = isTradeTime();
    return (
      <div className="h-48 flex flex-col items-center justify-center text-gray-500 text-sm">
        <div>{inTradeTime ? '正在采集分时数据...' : '暂无分时数据'}</div>
        <div className="text-xs mt-1 text-gray-400">
          {inTradeTime
            ? '数据将随时间自动累积（每30秒更新）'
            : '交易时间(9:30-15:00)内自动采集'}
        </div>
        {!useImage && (
          <button
            onClick={() => { setUseImage(true); setImageError(false); }}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600"
          >
            切换到图片模式
          </button>
        )}
      </div>
    );
  }

  const currentRate = parseFloat(estimateRate) || 0;
  const isUp = currentRate >= 0;
  const lastPoint = data[data.length - 1];

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ axisValue: string; data: number }>) => {
        const p = params[0];
        const rate = p.data;
        return `${p.axisValue}<br/>涨幅: <span style="color:${rate >= 0 ? '#ef4444' : '#22c55e'}">${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%</span>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.time),
      axisLabel: {
        fontSize: 9,
        interval: Math.floor(data.length / 6),
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 9, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      // 让0轴居中显示
      scale: false,
    },
    series: [
      {
        data: data.map((d) => d.rate),
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: isUp ? '#ef4444' : '#22c55e', width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isUp ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)' },
              { offset: 1, color: isUp ? 'rgba(239, 68, 68, 0.02)' : 'rgba(34, 197, 94, 0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 0 }],
          lineStyle: { color: '#9ca3af', type: 'dashed', width: 1 },
          label: { show: false },
        },
      },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">今日实时走势 ({data.length}个数据点)</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            更新于 {lastPoint?.time || '--:--'}
          </span>
          <button
            onClick={() => { setUseImage(true); setImageError(false); }}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            图片模式
          </button>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: '160px' }} />
    </div>
  );
}
