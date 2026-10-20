/**
 * State Management Generator
 *
 * Generates state management code for detected patterns
 */

import type { StatePattern, StoreInfo } from '../analysis/StateDetector';

export class StateGenerator {
  /**
   * Generate state management code
   */
  async generate(pattern: StatePattern, framework: 'react' | 'vue' | 'svelte' = 'react'): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    switch (pattern.type) {
      case 'redux':
        return this.generateRedux(pattern);
      case 'zustand':
        return this.generateZustand(pattern);
      case 'context':
        return this.generateContext(pattern);
      case 'mobx':
        return this.generateMobX(pattern);
      case 'jotai':
        return this.generateJotai(pattern);
      case 'recoil':
        return this.generateRecoil(pattern);
      default:
        return files;
    }
  }

  /**
   * Generate Redux store
   */
  private generateRedux(pattern: StatePattern): Map<string, string> {
    const files = new Map<string, string>();

    // Main store file
    files.set('store/index.ts', `import { configureStore } from '@reduxjs/toolkit';
${pattern.stores.map(s => `import ${s.name}Reducer from './${s.name}Slice';`).join('\n')}

export const store = configureStore({
  reducer: {
${pattern.stores.map(s => `    ${s.name}: ${s.name}Reducer`).join(',\n')}
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`);

    // Generate slices
    pattern.stores.forEach(store => {
      files.set(`store/${store.name}Slice.ts`, `import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ${store.name.charAt(0).toUpperCase() + store.name.slice(1)}State {
  // TODO: Add state shape
  items: any[];
}

const initialState: ${store.name.charAt(0).toUpperCase() + store.name.slice(1)}State = {
  items: []
};

const ${store.name}Slice = createSlice({
  name: '${store.name}',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<any>) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    }
  }
});

export const { addItem, removeItem } = ${store.name}Slice.actions;
export default ${store.name}Slice.reducer;`);
    });

    // Hooks
    files.set('store/hooks.ts', `import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;`);

    return files;
  }

  /**
   * Generate Zustand store
   */
  private generateZustand(pattern: StatePattern): Map<string, string> {
    const files = new Map<string, string>();

    pattern.stores.forEach(store => {
      files.set(`store/${store.name}.ts`, `import { create } from 'zustand';

interface ${store.name.charAt(0).toUpperCase() + store.name.slice(1)}State {
  items: any[];
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
}

export const use${store.name.charAt(0).toUpperCase() + store.name.slice(1)}Store = create<${store.name.charAt(0).toUpperCase() + store.name.slice(1)}State>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) }))
}));`);
    });

    return files;
  }

  /**
   * Generate Context API
   */
  private generateContext(pattern: StatePattern): Map<string, string> {
    const files = new Map<string, string>();

    pattern.stores.forEach(store => {
      const name = store.name.charAt(0).toUpperCase() + store.name.slice(1);

      files.set(`context/${store.name}.tsx`, `import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ${name}ContextType {
  state: any;
  setState: (value: any) => void;
}

const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

export const ${name}Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState({});

  return (
    <${name}Context.Provider value={{ state, setState }}>
      {children}
    </${name}Context.Provider>
  );
};

export const use${name} = () => {
  const context = useContext(${name}Context);
  if (!context) {
    throw new Error('use${name} must be used within ${name}Provider');
  }
  return context;
};`);
    });

    return files;
  }

  /**
   * Generate MobX store
   */
  private generateMobX(pattern: StatePattern): Map<string, string> {
    const files = new Map<string, string>();

    pattern.stores.forEach(store => {
      files.set(`store/${store.name}.ts`, `import { makeAutoObservable } from 'mobx';

class ${store.name.charAt(0).toUpperCase() + store.name.slice(1)}Store {
  items: any[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addItem(item: any) {
    this.items.push(item);
  }

  removeItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
  }
}

export const ${store.name}Store = new ${store.name.charAt(0).toUpperCase() + store.name.slice(1)}Store();`);
    });

    return files;
  }

  /**
   * Generate Jotai atoms
   */
  private generateJotai(pattern: StatePattern): Map<string, string> {
    const files = new Map<string, string>();

    files.set('store/atoms.ts', `import { atom } from 'jotai';

export const itemsAtom = atom<any[]>([]);
export const selectedItemAtom = atom<string | null>(null);`);

    return files;
  }

  /**
   * Generate Recoil atoms
   */
  private generateRecoil(pattern: StatePattern): Map<string, string> {
    const files = new Map<string, string>();

    files.set('store/atoms.ts', `import { atom } from 'recoil';

export const itemsState = atom({
  key: 'items',
  default: []
});

export const selectedItemState = atom({
  key: 'selectedItem',
  default: null
});`);

    return files;
  }
}
