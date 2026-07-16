import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinancialTransaction, Expense, Order } from '../types';

interface FinancialState {
  transactions: FinancialTransaction[];
  expenses: Expense[];

  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void;
  addExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  recordOrderIncome: (order: Order) => void;

  getTransactions: (filter?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => FinancialTransaction[];

  getExpensesByCategory: () => { category: string; total: number; count: number }[];

  getDailyStats: (days?: number) => {
    date: string;
    income: number;
    expense: number;
    net: number;
    orders: number;
  }[];

  getTotalIncome: (startDate?: string, endDate?: string) => number;
  getTotalExpense: (startDate?: string, endDate?: string) => number;
  getNetProfit: (startDate?: string, endDate?: string) => number;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const getDateStr = (isoString: string): string => isoString.substring(0, 10);

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      expenses: [],

      addTransaction: (tx) => {
        const newTx: FinancialTransaction = {
          ...tx,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));
      },

      addExpense: (exp) => {
        const newExp: Expense = {
          ...exp,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          expenses: [newExp, ...state.expenses],
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));
      },

      recordOrderIncome: (order) => {
        const newTx: FinancialTransaction = {
          id: generateId(),
          orderId: order.id,
          type: 'income',
          category: 'product_sale',
          description: `Penjualan dari pesanan #${order.id}`,
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          referenceNumber: order.id,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));
      },

      getTransactions: (filter) => {
        const { transactions } = get();
        if (!filter) return transactions;

        return transactions.filter((tx) => {
          if (filter.type && tx.type !== filter.type) return false;
          if (filter.category && tx.category !== filter.category) return false;
          if (filter.startDate) {
            const txDate = getDateStr(tx.createdAt);
            if (txDate < filter.startDate) return false;
          }
          if (filter.endDate) {
            const txDate = getDateStr(tx.createdAt);
            if (txDate > filter.endDate) return false;
          }
          return true;
        });
      },

      getExpensesByCategory: () => {
        const { expenses } = get();
        const categoryMap = new Map<string, { total: number; count: number }>();

        for (const exp of expenses) {
          const existing = categoryMap.get(exp.category);
          if (existing) {
            existing.total += exp.amount;
            existing.count += 1;
          } else {
            categoryMap.set(exp.category, { total: exp.amount, count: 1 });
          }
        }

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
        }));
      },

      getDailyStats: (days = 30) => {
        const { transactions, expenses } = get();

        // Build a map of date -> stats
        const statsMap = new Map<
          string,
          { income: number; expense: number; orders: number }
        >();

        // Initialize all days in range
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().substring(0, 10);
          statsMap.set(dateStr, { income: 0, expense: 0, orders: 0 });
        }

        const startDate = Array.from(statsMap.keys())[0];

        // Aggregate transactions
        for (const tx of transactions) {
          const txDate = getDateStr(tx.createdAt);
          if (txDate < startDate) continue;

          const entry = statsMap.get(txDate);
          if (!entry) continue;

          if (tx.type === 'income') {
            entry.income += tx.amount;
            entry.orders += 1;
          } else if (tx.type === 'expense' || tx.type === 'refund') {
            entry.expense += tx.amount;
          }
        }

        // Aggregate expenses
        for (const exp of expenses) {
          const expDate = getDateStr(exp.createdAt);
          if (expDate < startDate) continue;

          const entry = statsMap.get(expDate);
          if (!entry) continue;

          entry.expense += exp.amount;
        }

        // Convert to sorted array
        return Array.from(statsMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({
            date,
            income: data.income,
            expense: data.expense,
            net: data.income - data.expense,
            orders: data.orders,
          }));
      },

      getTotalIncome: (startDate, endDate) => {
        const { transactions } = get();
        return transactions
          .filter((tx) => {
            if (tx.type !== 'income') return false;
            const txDate = getDateStr(tx.createdAt);
            if (startDate && txDate < startDate) return false;
            if (endDate && txDate > endDate) return false;
            return true;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
      },

      getTotalExpense: (startDate, endDate) => {
        const { transactions, expenses } = get();

        const txExpense = transactions
          .filter((tx) => {
            if (tx.type !== 'expense' && tx.type !== 'refund') return false;
            const txDate = getDateStr(tx.createdAt);
            if (startDate && txDate < startDate) return false;
            if (endDate && txDate > endDate) return false;
            return true;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        const expTotal = expenses
          .filter((exp) => {
            const expDate = getDateStr(exp.createdAt);
            if (startDate && expDate < startDate) return false;
            if (endDate && expDate > endDate) return false;
            return true;
          })
          .reduce((sum, exp) => sum + exp.amount, 0);

        return txExpense + expTotal;
      },

      getNetProfit: (startDate, endDate) => {
        const state = get();
        const income = state.getTotalIncome(startDate, endDate);
        const expense = state.getTotalExpense(startDate, endDate);
        return income - expense;
      },
    }),
    {
      name: 'krupuk-financial-store',
    }
  )
);
