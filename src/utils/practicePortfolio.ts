// Local-only portfolio management for practice trading lessons
// Does NOT interact with database - purely in-memory

export interface Stock {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
}

export interface Portfolio {
  cash: number;
  stocks: Stock[];
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
}

export const createPracticePortfolio = (initialCash: number): Portfolio => ({
  cash: initialCash,
  stocks: [],
  transactions: []
});

export const buyStock = (
  portfolio: Portfolio,
  symbol: string,
  name: string,
  quantity: number,
  price: number,
  tradeDate?: string
): { success: boolean; message: string; portfolio?: Portfolio } => {
  const total = quantity * price;
  
  if (total > portfolio.cash) {
    return {
      success: false,
      message: 'Insufficient funds'
    };
  }

  const transaction: Transaction = {
    id: `tx-${Date.now()}`,
    type: 'buy',
    symbol,
    quantity,
    price,
    total,
    date: tradeDate || new Date().toISOString()
  };

  // Find existing stock or create new
  const existingStockIndex = portfolio.stocks.findIndex(s => s.symbol === symbol);
  let updatedStocks: Stock[];

  if (existingStockIndex >= 0) {
    const existingStock = portfolio.stocks[existingStockIndex];
    const totalQuantity = existingStock.quantity + quantity;
    const avgPrice = ((existingStock.purchasePrice * existingStock.quantity) + total) / totalQuantity;
    
    updatedStocks = [...portfolio.stocks];
    updatedStocks[existingStockIndex] = {
      ...existingStock,
      quantity: totalQuantity,
      purchasePrice: avgPrice,
      currentPrice: price
    };
  } else {
    const newStock: Stock = {
      symbol,
      name,
      quantity,
      purchasePrice: price,
      currentPrice: price,
      purchaseDate: tradeDate || new Date().toISOString()
    };
    updatedStocks = [...portfolio.stocks, newStock];
  }

  return {
    success: true,
    message: `Successfully bought ${quantity} shares of ${symbol}`,
    portfolio: {
      cash: portfolio.cash - total,
      stocks: updatedStocks,
      transactions: [transaction, ...portfolio.transactions]
    }
  };
};

export const sellStock = (
  portfolio: Portfolio,
  symbol: string,
  quantity: number,
  price: number,
  tradeDate?: string
): { success: boolean; message: string; portfolio?: Portfolio } => {
  const stock = portfolio.stocks.find(s => s.symbol === symbol);
  
  if (!stock) {
    return {
      success: false,
      message: 'Stock not found in portfolio'
    };
  }

  if (stock.quantity < quantity) {
    return {
      success: false,
      message: 'Insufficient shares'
    };
  }

  const total = quantity * price;
  
  const transaction: Transaction = {
    id: `tx-${Date.now()}`,
    type: 'sell',
    symbol,
    quantity,
    price,
    total,
    date: tradeDate || new Date().toISOString()
  };

  const newQuantity = stock.quantity - quantity;
  const updatedStocks = newQuantity === 0
    ? portfolio.stocks.filter(s => s.symbol !== symbol)
    : portfolio.stocks.map(s => 
        s.symbol === symbol 
          ? { ...s, quantity: newQuantity, currentPrice: price }
          : s
      );

  return {
    success: true,
    message: `Successfully sold ${quantity} shares of ${symbol}`,
    portfolio: {
      cash: portfolio.cash + total,
      stocks: updatedStocks,
      transactions: [transaction, ...portfolio.transactions]
    }
  };
};

export const updateStockPrices = (
  portfolio: Portfolio, 
  prices: { [symbol: string]: number }
): Portfolio => {
  const updatedStocks = portfolio.stocks.map(stock => ({
    ...stock,
    currentPrice: prices[stock.symbol] || stock.currentPrice
  }));

  return {
    ...portfolio,
    stocks: updatedStocks
  };
};

export const getPortfolioValue = (portfolio: Portfolio): number => {
  const stocksValue = portfolio.stocks.reduce((total, stock) => {
    return total + (stock.currentPrice * stock.quantity);
  }, 0);
  
  return portfolio.cash + stocksValue;
};

export const getPortfolioGainLoss = (
  portfolio: Portfolio, 
  initialCash: number
): { amount: number; percentage: number } => {
  const currentValue = getPortfolioValue(portfolio);
  const amount = currentValue - initialCash;
  const percentage = initialCash > 0 ? ((currentValue - initialCash) / initialCash) * 100 : 0;
  
  return { amount, percentage };
};
