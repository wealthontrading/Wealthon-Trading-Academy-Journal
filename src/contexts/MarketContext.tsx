import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { setGlobalMarketType } from '../utils/calculations';

type MarketType = 'Indian' | 'Forex';

interface MarketContextType {
  marketType: MarketType;
  setMarketType: (type: MarketType) => void;
  currencySymbol: string;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketType, setMarketType] = useState<MarketType>('Indian');

  useEffect(() => {
    setGlobalMarketType(marketType);
  }, [marketType]);

  const currencySymbol = marketType === 'Indian' ? '₹' : '$';

  return (
    <MarketContext.Provider value={{ marketType, setMarketType, currencySymbol }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
