import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useHistoryStore = create(
  persist(
    (set, get) => ({
      history: [],
      
      addToHistory: (record) => {
        const { history } = get();
        // record structure: { path, title, moduleType, source, target, timestamp }
        
        // Remove existing record with same path to avoid duplicates
        const filteredHistory = history.filter(item => item.path !== record.path);
        
        // Add new record to the beginning
        const newHistory = [record, ...filteredHistory];
        
        // Limit to 10 items
        if (newHistory.length > 10) {
          newHistory.length = 10;
        }
        
        set({ history: newHistory });
      },
      
      removeFromHistory: (path) => {
        const { history } = get();
        set({ history: history.filter(item => item.path !== path) });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'app-history-storage', // name of the item in the storage (must be unique)
    }
  )
);
