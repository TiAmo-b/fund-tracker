import { create } from 'zustand';
import type { FundEstimate, Position, Transaction, ProfitStats } from '../types';
import * as db from '../services/db';
import { fetchFundEstimates } from '../services/fundApi';

interface FundStore {
  // 状态
  positions: Position[];
  transactions: Transaction[];
  watchlist: Array<{ code: string; name: string }>;
  estimates: Map<string, FundEstimate>;
  loading: boolean;
  selectedFund: string | null;

  // 计算属性
  profitStats: ProfitStats;

  // 操作
  init: () => Promise<void>;
  refreshEstimates: () => Promise<void>;
  addFund: (code: string, name: string) => Promise<void>;
  removeFund: (code: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  selectFund: (code: string | null) => void;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

export const useFundStore = create<FundStore>((set, get) => ({
  positions: [],
  transactions: [],
  watchlist: [],
  estimates: new Map(),
  loading: false,
  selectedFund: null,
  profitStats: {
    totalCost: 0,
    totalValue: 0,
    totalProfit: 0,
    totalProfitRate: 0,
    todayProfit: 0,
  },

  init: async () => {
    set({ loading: true });
    const [positions, transactions, watchlist] = await Promise.all([
      db.getPositions(),
      db.getTransactions(),
      db.getWatchlist(),
    ]);
    set({ positions, transactions, watchlist, loading: false });
    get().refreshEstimates();
  },

  refreshEstimates: async () => {
    const { positions, watchlist } = get();
    const codes = [
      ...positions.map((p) => p.fundCode),
      ...watchlist.map((w) => w.code),
    ];
    const uniqueCodes = [...new Set(codes)];
    if (uniqueCodes.length === 0) return;

    const estimates = await fetchFundEstimates(uniqueCodes);
    set({ estimates });

    // 计算收益统计
    const { positions: pos } = get();
    let totalCost = 0;
    let totalValue = 0;
    let todayProfit = 0;

    pos.forEach((p) => {
      const est = estimates.get(p.fundCode);
      if (est) {
        totalCost += p.cost;
        const currentValue = p.shares * est.estimateValue;
        totalValue += currentValue;
        todayProfit += p.shares * est.netValue * (parseFloat(est.estimateRate) / 100);
      }
    });

    const totalProfit = totalValue - totalCost;
    const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    set({
      profitStats: { totalCost, totalValue, totalProfit, totalProfitRate, todayProfit },
    });
  },

  addFund: async (code, name) => {
    await db.addToWatchlist(code, name);
    const watchlist = await db.getWatchlist();
    set({ watchlist });
    get().refreshEstimates();
  },

  removeFund: async (code) => {
    await db.removeFromWatchlist(code);
    await db.deletePosition(code);
    const [watchlist, positions] = await Promise.all([
      db.getWatchlist(),
      db.getPositions(),
    ]);
    set({ watchlist, positions });
  },

  addTransaction: async (txData) => {
    const tx: Transaction = {
      ...txData,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
    };
    await db.addTransaction(tx);

    // 更新持仓
    const { positions, estimates } = get();
    let position = positions.find((p) => p.fundCode === tx.fundCode);
    const est = estimates.get(tx.fundCode);

    if (!position) {
      position = {
        fundCode: tx.fundCode,
        fundName: est?.name || tx.fundCode,
        shares: 0,
        cost: 0,
        avgCost: 0,
      };
    }

    if (tx.type === 'buy') {
      position.shares += tx.shares;
      position.cost += tx.amount + tx.fee;
    } else {
      position.shares -= tx.shares;
      position.cost -= tx.shares * position.avgCost;
    }
    position.avgCost = position.shares > 0 ? position.cost / position.shares : 0;

    await db.updatePosition(position);

    const [newPositions, transactions] = await Promise.all([
      db.getPositions(),
      db.getTransactions(),
    ]);
    set({ positions: newPositions, transactions });
    get().refreshEstimates();
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id);
    const transactions = await db.getTransactions();
    set({ transactions });
  },

  selectFund: (code) => set({ selectedFund: code }),

  exportData: () => db.exportData(),

  importData: async (json) => {
    await db.importData(json);
    get().init();
  },
}));
