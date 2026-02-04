// 基金基本信息
export interface Fund {
  code: string;          // 基金代码
  name: string;          // 基金名称
  type?: string;         // 基金类型
}

// 基金实时估值
export interface FundEstimate {
  code: string;          // 基金代码
  name: string;          // 基金名称
  netValue: number;      // 单位净值
  estimateValue: number; // 估算净值
  estimateRate: string;  // 估算涨跌幅
  estimateTime: string;  // 估算时间
}

// 交易记录
export interface Transaction {
  id: string;            // 交易ID
  fundCode: string;      // 基金代码
  type: 'buy' | 'sell';  // 交易类型
  amount: number;        // 交易金额
  shares: number;        // 份额
  netValue: number;      // 成交净值
  fee: number;           // 手续费
  date: string;          // 交易日期
  createdAt: number;     // 创建时间戳
}

// 持仓信息
export interface Position {
  fundCode: string;      // 基金代码
  fundName: string;      // 基金名称
  shares: number;        // 持有份额
  cost: number;          // 持仓成本
  avgCost: number;       // 平均成本
}

// 历史净值
export interface NetValueHistory {
  date: string;          // 日期
  netValue: number;      // 单位净值
  accNetValue: number;   // 累计净值
  rate: string;          // 日涨跌幅
}

// 收益统计
export interface ProfitStats {
  totalCost: number;        // 总成本
  totalValue: number;       // 总市值
  totalProfit: number;      // 总收益
  totalProfitRate: number;  // 总收益率
  todayProfit: number;      // 今日收益
}

// 重仓股
export interface HoldingStock {
  code: string;             // 股票代码
  name: string;             // 股票名称
  ratio: string;            // 持仓占比
  amount: string;           // 持仓市值(万元)
  change: string;           // 较上期变化
}

// 业绩走势数据点
export interface PerformancePoint {
  date: string;
  fundValue: number;        // 基金涨幅
  indexValue: number;       // 指数涨幅
}

// 实时走势数据点
export interface RealtimePoint {
  time: string;             // 时间 HH:mm
  value: number;            // 估值
  rate: number;             // 涨跌幅
}
