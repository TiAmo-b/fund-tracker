import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Transaction, Position, RealtimePoint } from '../types';

interface IntradayData {
  fundCode: string;
  date: string; // YYYY-MM-DD
  points: RealtimePoint[];
  updatedAt: number;
}

interface FundTrackerDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-fund': string; 'by-date': string };
  };
  positions: {
    key: string;
    value: Position;
  };
  watchlist: {
    key: string;
    value: { code: string; name: string; addedAt: number };
  };
  intraday: {
    key: string; // fundCode_date
    value: IntradayData;
    indexes: { 'by-fund': string; 'by-date': string };
  };
}

let db: IDBPDatabase<FundTrackerDB> | null = null;

async function getDB(): Promise<IDBPDatabase<FundTrackerDB>> {
  if (db) return db;

  db = await openDB<FundTrackerDB>('fund-tracker', 2, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        // 交易记录表
        const txStore = database.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by-fund', 'fundCode');
        txStore.createIndex('by-date', 'date');

        // 持仓表
        database.createObjectStore('positions', { keyPath: 'fundCode' });

        // 自选基金表
        database.createObjectStore('watchlist', { keyPath: 'code' });
      }

      if (oldVersion < 2) {
        // 分时数据表
        const intradayStore = database.createObjectStore('intraday', { keyPath: 'fundCode' });
        intradayStore.createIndex('by-fund', 'fundCode');
        intradayStore.createIndex('by-date', 'date');
      }
    },
  });

  return db;
}

// 交易记录操作
export async function addTransaction(tx: Transaction): Promise<void> {
  const database = await getDB();
  await database.put('transactions', tx);
}

export async function getTransactions(fundCode?: string): Promise<Transaction[]> {
  const database = await getDB();
  if (fundCode) {
    return database.getAllFromIndex('transactions', 'by-fund', fundCode);
  }
  return database.getAll('transactions');
}

export async function deleteTransaction(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('transactions', id);
}

// 持仓操作
export async function updatePosition(position: Position): Promise<void> {
  const database = await getDB();
  await database.put('positions', position);
}

export async function getPositions(): Promise<Position[]> {
  const database = await getDB();
  return database.getAll('positions');
}

export async function deletePosition(fundCode: string): Promise<void> {
  const database = await getDB();
  await database.delete('positions', fundCode);
}

// 自选基金操作
export async function addToWatchlist(code: string, name: string): Promise<void> {
  const database = await getDB();
  await database.put('watchlist', { code, name, addedAt: Date.now() });
}

export async function getWatchlist(): Promise<Array<{ code: string; name: string }>> {
  const database = await getDB();
  return database.getAll('watchlist');
}

export async function removeFromWatchlist(code: string): Promise<void> {
  const database = await getDB();
  await database.delete('watchlist', code);
}

// 数据导出
export async function exportData(): Promise<string> {
  const database = await getDB();
  const data = {
    transactions: await database.getAll('transactions'),
    positions: await database.getAll('positions'),
    watchlist: await database.getAll('watchlist'),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

// 数据导入
export async function importData(jsonStr: string): Promise<void> {
  const database = await getDB();
  const data = JSON.parse(jsonStr);

  const tx = database.transaction(['transactions', 'positions', 'watchlist'], 'readwrite');

  for (const item of data.transactions || []) {
    await tx.objectStore('transactions').put(item);
  }
  for (const item of data.positions || []) {
    await tx.objectStore('positions').put(item);
  }
  for (const item of data.watchlist || []) {
    await tx.objectStore('watchlist').put(item);
  }

  await tx.done;
}

// 分时数据操作
function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function getIntradayData(fundCode: string): Promise<RealtimePoint[]> {
  const database = await getDB();
  const today = getTodayDate();
  const data = await database.get('intraday', fundCode);

  // 如果数据不是今天的，返回空数组
  if (!data || data.date !== today) {
    return [];
  }

  return data.points;
}

export async function addIntradayPoint(fundCode: string, point: RealtimePoint): Promise<void> {
  const database = await getDB();
  const today = getTodayDate();

  let data = await database.get('intraday', fundCode);

  // 如果没有数据或者不是今天的数据，创建新的
  if (!data || data.date !== today) {
    data = {
      fundCode,
      date: today,
      points: [],
      updatedAt: Date.now(),
    };
  }

  // 检查是否已有相同时间的数据点，如果有则更新
  const existingIndex = data.points.findIndex(p => p.time === point.time);
  if (existingIndex >= 0) {
    data.points[existingIndex] = point;
  } else {
    data.points.push(point);
    // 按时间排序
    data.points.sort((a, b) => a.time.localeCompare(b.time));
  }

  data.updatedAt = Date.now();
  await database.put('intraday', data);
}

export async function clearOldIntradayData(): Promise<void> {
  const database = await getDB();
  const today = getTodayDate();
  const allData = await database.getAll('intraday');

  for (const data of allData) {
    if (data.date !== today) {
      await database.delete('intraday', data.fundCode);
    }
  }
}
