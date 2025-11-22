import { supabase } from "@/integrations/supabase/client";

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

const INITIAL_CASH = 100000; // ₹1,00,000 starting virtual cash

export const getPortfolio = async (): Promise<Portfolio> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return empty portfolio for non-authenticated users
      return {
        cash: INITIAL_CASH,
        stocks: [],
        transactions: []
      };
    }

    // Get or create portfolio
    let { data: portfolio } = await supabase
      .from('simulator_portfolios')
      .select('cash')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!portfolio) {
      // Create new portfolio
      const { data: newPortfolio } = await supabase
        .from('simulator_portfolios')
        .insert({ user_id: user.id, cash: INITIAL_CASH })
        .select('cash')
        .single();
      
      portfolio = newPortfolio;
    }

    // Get holdings
    const { data: holdings } = await supabase
      .from('simulator_holdings')
      .select('*')
      .eq('user_id', user.id);

    // Get transactions
    const { data: trades } = await supabase
      .from('simulator_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('traded_at', { ascending: false });

    const stocks: Stock[] = (holdings || []).map(h => ({
      symbol: h.symbol,
      name: h.stock_name,
      quantity: h.quantity,
      purchasePrice: Number(h.purchase_price),
      currentPrice: Number(h.current_price),
      purchaseDate: h.purchase_date
    }));

    const transactions: Transaction[] = (trades || []).map(t => ({
      id: t.id,
      type: t.trade_type as 'buy' | 'sell',
      symbol: t.symbol,
      quantity: t.quantity,
      price: Number(t.price),
      total: Number(t.total),
      date: t.traded_at
    }));

    return {
      cash: Number(portfolio?.cash || INITIAL_CASH),
      stocks,
      transactions
    };
  } catch (error) {
    console.error('Error reading portfolio from Supabase:', error);
    return {
      cash: INITIAL_CASH,
      stocks: [],
      transactions: []
    };
  }
};

export const savePortfolio = async (portfolio: Portfolio): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot save portfolio: User not authenticated');
      return;
    }

    // Update cash balance
    await supabase
      .from('simulator_portfolios')
      .upsert({
        user_id: user.id,
        cash: portfolio.cash
      });
  } catch (error) {
    console.error('Error saving portfolio to Supabase:', error);
  }
};

export const resetPortfolio = async (): Promise<Portfolio> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        cash: INITIAL_CASH,
        stocks: [],
        transactions: []
      };
    }

    // Delete all holdings
    await supabase
      .from('simulator_holdings')
      .delete()
      .eq('user_id', user.id);

    // Delete all trades
    await supabase
      .from('simulator_trades')
      .delete()
      .eq('user_id', user.id);

    // Reset portfolio cash
    await supabase
      .from('simulator_portfolios')
      .upsert({
        user_id: user.id,
        cash: INITIAL_CASH
      });

    return {
      cash: INITIAL_CASH,
      stocks: [],
      transactions: []
    };
  } catch (error) {
    console.error('Error resetting portfolio:', error);
    return {
      cash: INITIAL_CASH,
      stocks: [],
      transactions: []
    };
  }
};

export const buyStock = async (
  portfolio: Portfolio,
  symbol: string,
  name: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; message: string; portfolio?: Portfolio }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    const total = quantity * price;
    
    if (total > portfolio.cash) {
      return {
        success: false,
        message: 'Insufficient funds'
      };
    }

    // Record trade
    await supabase
      .from('simulator_trades')
      .insert({
        user_id: user.id,
        symbol,
        stock_name: name,
        trade_type: 'buy',
        quantity,
        price,
        total
      });

    // Update or create holding
    const { data: existingHolding } = await supabase
      .from('simulator_holdings')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', symbol)
      .maybeSingle();

    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;
      const avgPrice = ((Number(existingHolding.purchase_price) * existingHolding.quantity) + total) / totalQuantity;
      
      await supabase
        .from('simulator_holdings')
        .update({
          quantity: totalQuantity,
          purchase_price: avgPrice,
          current_price: price
        })
        .eq('user_id', user.id)
        .eq('symbol', symbol);
    } else {
      await supabase
        .from('simulator_holdings')
        .insert({
          user_id: user.id,
          symbol,
          stock_name: name,
          quantity,
          purchase_price: price,
          current_price: price
        });
    }

    // Update cash balance
    const newCash = portfolio.cash - total;
    await supabase
      .from('simulator_portfolios')
      .update({ cash: newCash })
      .eq('user_id', user.id);

    // Get updated portfolio
    const updatedPortfolio = await getPortfolio();
    
    return {
      success: true,
      message: `Successfully bought ${quantity} shares of ${symbol}`,
      portfolio: updatedPortfolio
    };
  } catch (error) {
    console.error('Error buying stock:', error);
    return {
      success: false,
      message: 'Failed to buy stock'
    };
  }
};

export const sellStock = async (
  portfolio: Portfolio,
  symbol: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; message: string; portfolio?: Portfolio }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    const { data: holding } = await supabase
      .from('simulator_holdings')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', symbol)
      .maybeSingle();
    
    if (!holding) {
      return {
        success: false,
        message: 'Stock not found in portfolio'
      };
    }

    if (holding.quantity < quantity) {
      return {
        success: false,
        message: 'Insufficient shares'
      };
    }

    const total = quantity * price;
    
    // Record trade
    await supabase
      .from('simulator_trades')
      .insert({
        user_id: user.id,
        symbol,
        stock_name: holding.stock_name,
        trade_type: 'sell',
        quantity,
        price,
        total
      });

    // Update or delete holding
    const newQuantity = holding.quantity - quantity;
    
    if (newQuantity === 0) {
      await supabase
        .from('simulator_holdings')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);
    } else {
      await supabase
        .from('simulator_holdings')
        .update({
          quantity: newQuantity,
          current_price: price
        })
        .eq('user_id', user.id)
        .eq('symbol', symbol);
    }

    // Update cash balance
    const newCash = portfolio.cash + total;
    await supabase
      .from('simulator_portfolios')
      .update({ cash: newCash })
      .eq('user_id', user.id);

    // Get updated portfolio
    const updatedPortfolio = await getPortfolio();

    return {
      success: true,
      message: `Successfully sold ${quantity} shares of ${symbol}`,
      portfolio: updatedPortfolio
    };
  } catch (error) {
    console.error('Error selling stock:', error);
    return {
      success: false,
      message: 'Failed to sell stock'
    };
  }
};

export const updateStockPrices = async (portfolio: Portfolio, prices: { [symbol: string]: number }): Promise<Portfolio> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return portfolio;
    }

    // Update current prices in holdings
    for (const [symbol, price] of Object.entries(prices)) {
      await supabase
        .from('simulator_holdings')
        .update({ current_price: price })
        .eq('user_id', user.id)
        .eq('symbol', symbol);
    }

    // Get updated portfolio
    return await getPortfolio();
  } catch (error) {
    console.error('Error updating stock prices:', error);
    return portfolio;
  }
};

export const getPortfolioValue = (portfolio: Portfolio): number => {
  const stocksValue = portfolio.stocks.reduce((total, stock) => {
    return total + (stock.currentPrice * stock.quantity);
  }, 0);
  
  return portfolio.cash + stocksValue;
};

export const getPortfolioGainLoss = (portfolio: Portfolio, initialCash?: number): { amount: number; percentage: number } => {
  const initialValue = initialCash || INITIAL_CASH;
  const currentValue = getPortfolioValue(portfolio);
  const amount = currentValue - initialValue;
  const percentage = initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
  
  return { amount, percentage };
};
