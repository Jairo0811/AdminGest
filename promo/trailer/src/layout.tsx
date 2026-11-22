import { createContext, useContext } from 'react';

export type Orientation = 'landscape' | 'portrait';

export const LayoutContext = createContext<Orientation>('landscape');
export const useOrientation = () => useContext(LayoutContext);
export const useIsPortrait = () => useContext(LayoutContext) === 'portrait';
