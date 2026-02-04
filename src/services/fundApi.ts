import type { FundEstimate, NetValueHistory, HoldingStock, PerformancePoint, RealtimePoint } from '../types';
import { getIntradayData, addIntradayPoint } from './db';

// 判断是否为生产环境
const isProd = import.meta.env.PROD;

// 判断是否在交易时间内 (9:30-15:00)
function isTradeTime(): boolean {
  const now = new Date();
  const day = now.getDay();
  // 周末不交易
  if (day === 0 || day === 6) return false;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  // 9:30 - 11:30 或 13:00 - 15:00
  return (time >= 9 * 60 + 30 && time <= 11 * 60 + 30) || (time >= 13 * 60 && time <= 15 * 60);
}

// 获取当前时间字符串 HH:MM
function getCurrentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// 获取基金实时估值
export async function fetchFundEstimate(code: string): Promise<FundEstimate | null> {
  try {
    if (isProd) {
      // 生产环境使用 serverless API
      const response = await fetch(`/api/estimate?code=${code}`);
      const data = await response.json();
      if (data.error) return null;
      return {
        code: data.fundcode,
        name: data.name,
        netValue: parseFloat(data.dwjz),
        estimateValue: parseFloat(data.gsz),
        estimateRate: data.gszzl,
        estimateTime: data.gztime,
      };
    } else {
      // 开发环境使用 Vite 代理
      const response = await fetch(`/api/eastmoney/js/${code}.js?rt=${Date.now()}`);
      const text = await response.text();
      const match = text.match(/jsonpgz\((.*)\)/);
      if (!match) return null;
      const data = JSON.parse(match[1]);
      return {
        code: data.fundcode,
        name: data.name,
        netValue: parseFloat(data.dwjz),
        estimateValue: parseFloat(data.gsz),
        estimateRate: data.gszzl,
        estimateTime: data.gztime,
      };
    }
  } catch (error) {
    console.error('获取基金估值失败:', code, error);
    return null;
  }
}

// 批量获取基金估值
export async function fetchFundEstimates(codes: string[]): Promise<Map<string, FundEstimate>> {
  const results = new Map<string, FundEstimate>();
  const promises = codes.map(async (code) => {
    const estimate = await fetchFundEstimate(code);
    if (estimate) {
      results.set(code, estimate);
    }
  });
  await Promise.all(promises);
  return results;
}

// 获取基金历史净值
export async function fetchNetValueHistory(
  code: string,
  page = 1,
  pageSize = 30
): Promise<NetValueHistory[]> {
  try {
    const url = isProd
      ? `/api/fund?code=${code}&page=${page}&per=${pageSize}`
      : `/api/fund/F10DataApi.aspx?type=lsjz&code=${code}&page=${page}&per=${pageSize}`;
    const response = await fetch(url);
    const text = await response.text();

    // 解析 HTML 表格数据
    const history: NetValueHistory[] = [];
    const tableMatch = text.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) return history;

    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[1])) !== null) {
      const cells = rowMatch[1].match(/<td[^>]*>(.*?)<\/td>/g);
      if (cells && cells.length >= 4) {
        const getValue = (cell: string) => cell.replace(/<[^>]*>/g, '').trim();
        history.push({
          date: getValue(cells[0]),
          netValue: parseFloat(getValue(cells[1])) || 0,
          accNetValue: parseFloat(getValue(cells[2])) || 0,
          rate: getValue(cells[3]) || '0.00%',
        });
      }
    }
    return history;
  } catch (error) {
    console.error('获取历史净值失败:', code, error);
    return [];
  }
}

// 搜索基金
export async function searchFund(keyword: string): Promise<Array<{ code: string; name: string }>> {
  try {
    if (isProd) {
      // 生产环境使用 serverless API
      const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      if (!data.Datas) return [];
      return data.Datas.map((item: { CODE: string; NAME: string }) => ({
        code: item.CODE,
        name: item.NAME,
      }));
    } else {
      // 开发环境使用 Vite 代理
      const url = `/api/search/FundSearch/api/FundSearchAPI.ashx?callback=cb&m=1&key=${encodeURIComponent(keyword)}`;
      const response = await fetch(url);
      const text = await response.text();
      const match = text.match(/cb\((.*)\)/);
      if (!match) return [];
      const data = JSON.parse(match[1]);
      if (!data.Datas) return [];
      return data.Datas.map((item: { CODE: string; NAME: string }) => ({
        code: item.CODE,
        name: item.NAME,
      }));
    }
  } catch (error) {
    console.error('搜索基金失败:', error);
    return [];
  }
}

// 获取基金重仓股
export async function fetchHoldingStocks(code: string): Promise<HoldingStock[]> {
  try {
    const url = isProd
      ? `/api/fund?type=jjcc&code=${code}&topline=10`
      : `/api/fund/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=10`;
    const response = await fetch(url);
    const text = await response.text();

    const stocks: HoldingStock[] = [];
    // 解析返回的数据格式: var apidata={ content:"<table>...</table>",binddate:"2024-12-31" };
    const tableMatch = text.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) return stocks;

    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[1])) !== null) {
      const cells = rowMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/g);
      // 表格结构: 序号, 股票代码, 股票名称, 最新价, 涨跌幅, 相关资讯, 占净值比例, 持股数, 持仓市值
      if (cells && cells.length >= 7) {
        const getValue = (cell: string) => cell.replace(/<[^>]*>/g, '').trim();
        const codeMatch = cells[1].match(/<a[^>]*>(.*?)<\/a>/);
        const nameMatch = cells[2].match(/<a[^>]*>(.*?)<\/a>/);
        stocks.push({
          code: codeMatch ? codeMatch[1].trim() : getValue(cells[1]),
          name: nameMatch ? nameMatch[1].trim() : getValue(cells[2]),
          ratio: getValue(cells[6]),
          amount: getValue(cells[8]) || '',
          change: '新增',
        });
      }
    }
    return stocks;
  } catch (error) {
    console.error('获取重仓股失败:', code, error);
    return [];
  }
}

// 获取业绩走势数据 - 使用历史净值数据计算
export async function fetchPerformance(code: string, period = '3m'): Promise<PerformancePoint[]> {
  try {
    // 根据周期确定获取的数据量
    const periodDays: Record<string, number> = {
      '1m': 22,
      '3m': 66,
      '6m': 132,
      '1y': 252,
      '3y': 756,
    };
    const days = periodDays[period] || 66;

    // 使用历史净值接口
    const url = isProd
      ? `/api/fund?code=${code}&page=1&per=${days}`
      : `/api/fund/F10DataApi.aspx?type=lsjz&code=${code}&page=1&per=${days}`;
    const response = await fetch(url);
    const text = await response.text();

    const history: PerformancePoint[] = [];
    const tableMatch = text.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableMatch) return history;

    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[1])) !== null) {
      const cells = rowMatch[1].match(/<td[^>]*>(.*?)<\/td>/g);
      if (cells && cells.length >= 2) {
        const getValue = (cell: string) => cell.replace(/<[^>]*>/g, '').trim();
        history.push({
          date: getValue(cells[0]),
          fundValue: parseFloat(getValue(cells[1])) || 0,
          indexValue: 0,
        });
      }
    }
    // 反转数组，让日期从早到晚
    return history.reverse();
  } catch (error) {
    console.error('获取业绩走势失败:', code, error);
    return [];
  }
}

// 获取实时走势数据（当日分时）- 自累积方式
// 由于免费API不提供分时历史数据，我们通过定时获取当前估值来累积数据
export async function fetchRealtimeTrend(code: string): Promise<RealtimePoint[]> {
  try {
    // 获取已累积的数据
    const existingData = await getIntradayData(code);

    // 如果在交易时间内，获取当前估值并添加新数据点
    if (isTradeTime()) {
      const estimate = await fetchFundEstimate(code);
      if (estimate && estimate.estimateRate) {
        const newPoint: RealtimePoint = {
          time: getCurrentTimeStr(),
          value: estimate.estimateValue,
          rate: parseFloat(estimate.estimateRate) || 0,
        };
        await addIntradayPoint(code, newPoint);

        // 检查是否已有相同时间的数据点
        const existingIndex = existingData.findIndex(p => p.time === newPoint.time);
        if (existingIndex >= 0) {
          existingData[existingIndex] = newPoint;
        } else {
          existingData.push(newPoint);
          existingData.sort((a, b) => a.time.localeCompare(b.time));
        }
      }
    }

    return existingData;
  } catch (error) {
    console.error('获取实时走势失败:', code, error);
    // 即使出错也返回已有数据
    try {
      return await getIntradayData(code);
    } catch {
      return [];
    }
  }
}
