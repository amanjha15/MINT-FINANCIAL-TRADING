import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, RotateCcw, FastForward, Calendar } from "lucide-react";
import PracticeTradeDialog from "./PracticeTradeDialog";
import HoldingsTable from "@/components/simulator/HoldingsTable";
import TransactionHistory from "@/components/simulator/TransactionHistory";
import PracticeResults from "./PracticeResults";
import StockDetailView from "./StockDetailView";

// Known stock names mapping to avoid API rate limits
const STOCK_NAMES: Record<string, string> = {
  'INFY.NS': 'Infosys Limited',
  'HDFCBANK.NS': 'HDFC Bank Limited',
  'ICICIBANK.NS': 'ICICI Bank Limited',
  'TCS.NS': 'Tata Consultancy Services',
  'RELIANCE.NS': 'Reliance Industries Limited',
  'WIPRO.NS': 'Wipro Limited',
  'ITC.NS': 'ITC Limited',
  'SBIN.NS': 'State Bank of India',
  'BHARTIARTL.NS': 'Bharti Airtel Limited',
  'KOTAKBANK.NS': 'Kotak Mahindra Bank Limited'
};
import { 
  Portfolio, 
  createPracticePortfolio, 
  getPortfolioValue, 
  getPortfolioGainLoss,
  updateStockPrices
} from "@/utils/practicePortfolio";
import { getHistoricalPrice } from "@/utils/marketData";
import { format, startOfYear, addMonths } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
interface PracticeTradingModeProps {
  practiceStocks: string[];
  initialCash?: number;
  practiceDate?: string;
  lessonId?: string;
  onComplete: () => void;
}

const PracticeTradingMode = ({
  practiceStocks,
  initialCash = 50000,
  practiceDate: providedDate,
  lessonId,
  onComplete
}: PracticeTradingModeProps) => {
  // Use provided practice date or default to Dec 2, 2024
  const defaultPracticeDate = "2024-12-02T00:00:00Z";
  const practiceDate = providedDate || defaultPracticeDate;
  
  // Calculate end date as 10 months after start (Oct 2, 2025 for default)
  const practiceEndDate = addMonths(new Date(practiceDate), 10).toISOString();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>(createPracticePortfolio(initialCash));
  const [tradeDialog, setTradeDialog] = useState({
    open: false,
    symbol: "",
    name: "",
    price: 0
  });
  const [showResults, setShowResults] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string; price: number } | null>(null);
  const [loadingStockDetail, setLoadingStockDetail] = useState(false);

  // Prepare suggested stocks without fetching prices
  const suggestedStocks = practiceStocks.map(symbol => ({
    symbol,
    name: STOCK_NAMES[symbol] || symbol.replace('.NS', '')
  }));

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user?.id || null,
          lesson_id: lessonId || null,
          practice_date: practiceDate,
          initial_cash: initialCash
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast.error('Failed to create practice session');
      } else {
        setSessionId(data.id);
      }
    };

    createSession();
  }, []);

  const portfolioValue = getPortfolioValue(portfolio);
  const {
    amount: gainLoss,
    percentage: gainLossPercent
  } = getPortfolioGainLoss(portfolio, initialCash);
  const handleReset = async () => {
    if (confirm("Reset practice portfolio?")) {
      setPortfolio(createPracticePortfolio(initialCash));
      setShowResults(false);
      
      // Create new session
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user?.id || null,
          lesson_id: lessonId || null,
          practice_date: practiceDate,
          initial_cash: initialCash
        })
        .select()
        .single();

      if (!error && data) {
        setSessionId(data.id);
      }
    }
  };
  const handleStockClick = async (symbol: string, name: string) => {
    setLoadingStockDetail(true);
    try {
      const price = await getHistoricalPrice(symbol, practiceDate);
      if (price > 0) {
        setSelectedStock({ symbol, name, price });
      } else {
        toast.error('Unable to load historical price for this stock');
      }
    } catch (error) {
      console.error('Error loading stock:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoadingStockDetail(false);
    }
  };

  const handleTradeClick = (symbol: string, name: string, price: number) => {
    setTradeDialog({
      open: true,
      symbol,
      name,
      price
    });
  };
  const handleTradeComplete = async (updatedPortfolio: Portfolio, tradeTimestamp?: string) => {
    setPortfolio(updatedPortfolio);
    
    // Save the trade to Supabase
    if (sessionId) {
      const lastTransaction = updatedPortfolio.transactions[0]; // transactions are unshifted, so [0] is the latest
      if (lastTransaction) {
        // Find stock name from portfolio
        const stock = updatedPortfolio.stocks.find(s => s.symbol === lastTransaction.symbol);
        const stockName = stock?.name || lastTransaction.symbol;
        
        await supabase.from('practice_trades').insert({
          session_id: sessionId,
          symbol: lastTransaction.symbol,
          stock_name: stockName,
          trade_type: lastTransaction.type,
          quantity: lastTransaction.quantity,
          price_at_trade: lastTransaction.price,
          total_cost: lastTransaction.total
        });
      }
    }
  };
  const handleFastForward = async () => {
    if (!sessionId || portfolio.stocks.length === 0) {
      toast.error("Make some trades first!");
      return;
    }

    toast.loading("Calculating your results...");
    setIsUpdatingPrices(true);

    try {
      // Get CURRENT market prices (today's prices) for all stocks in portfolio
      const symbols = portfolio.stocks.map(stock => stock.symbol);
      const { getMultipleQuotes } = await import('@/utils/marketData');
      const currentQuotes = await getMultipleQuotes(symbols, true); // Force refresh
      
      // Build price updates from current market data
      const priceUpdates: { [symbol: string]: number } = {};
      for (const symbol of symbols) {
        if (currentQuotes[symbol]) {
          priceUpdates[symbol] = currentQuotes[symbol].price;
        }
      }

      const updatedPortfolio = updateStockPrices(portfolio, priceUpdates);

      const finalValue = getPortfolioValue(updatedPortfolio);
      const { amount: gainLoss, percentage: gainLossPercent } = getPortfolioGainLoss(updatedPortfolio, initialCash);

      // Update session in database with current timestamp
      const completedAt = new Date().toISOString();
      await supabase
        .from('practice_sessions')
        .update({
          final_cash: updatedPortfolio.cash,
          total_value: finalValue,
          gain_loss_amount: gainLoss,
          gain_loss_percent: gainLossPercent,
          completed: true,
          completed_at: completedAt
        })
        .eq('id', sessionId);

      // Update all trades with completion prices
      const { data: trades } = await supabase
        .from('practice_trades')
        .select('*')
        .eq('session_id', sessionId);

      if (trades && trades.length > 0) {
        // Get current prices for all traded stocks (not just held ones)
        const tradedSymbols = [...new Set(trades.map(t => t.symbol))];
        const tradeSymbolPrices: { [symbol: string]: number } = {};
        
        for (const symbol of tradedSymbols) {
          // Check if we already have the price from earlier fetch
          if (priceUpdates[symbol]) {
            tradeSymbolPrices[symbol] = priceUpdates[symbol];
          } else {
            // Fetch current price for this symbol
            if (currentQuotes[symbol]) {
              tradeSymbolPrices[symbol] = currentQuotes[symbol].price;
            }
          }
        }

        // Update each trade with current prices and calculate gains/losses
        for (const trade of trades) {
          const priceAtCompletion = tradeSymbolPrices[trade.symbol];
          
          if (priceAtCompletion) {
            let gainLossAmount = 0;
            let gainLossPercent = 0;

            if (trade.trade_type === 'buy') {
              gainLossAmount = (priceAtCompletion - trade.price_at_trade) * trade.quantity;
              gainLossPercent = ((priceAtCompletion - trade.price_at_trade) / trade.price_at_trade) * 100;
            } else if (trade.trade_type === 'sell') {
              // For sell trades, calculate based on the difference at time of sale
              gainLossAmount = (trade.price_at_trade - priceAtCompletion) * trade.quantity;
              gainLossPercent = ((trade.price_at_trade - priceAtCompletion) / priceAtCompletion) * 100;
            }

            await supabase
              .from('practice_trades')
              .update({
                price_at_completion: priceAtCompletion,
                gain_loss_amount: gainLossAmount,
                gain_loss_percent: gainLossPercent
              })
              .eq('id', trade.id);
          }
        }
      }

      // Fetch updated trades for results view
      const { data: updatedTrades } = await supabase
        .from('practice_trades')
        .select('*')
        .eq('session_id', sessionId)
        .order('traded_at', { ascending: true });

      // Get actual trading period from trades
      // Start date is the practice date (historical date when portfolio started)
      // End date is today (when we fast-forward and check current prices)
      const startDate = practiceDate; // Historical date we started from
      const endDate = completedAt; // Today's date when completing

      setResultsData({
        practiceDate: startDate,
        practiceEndDate: endDate,
        initialCash,
        finalCash: updatedPortfolio.cash,
        totalValue: finalValue,
        gainLossAmount: gainLoss,
        gainLossPercent,
        trades: updatedTrades || []
      });

      setShowResults(true);
      toast.dismiss();
      toast.success("Results calculated!");
    } catch (error) {
      console.error('Error calculating results:', error);
      toast.error('Failed to calculate results');
    } finally {
      setIsUpdatingPrices(false);
    }
  };
  if (showResults && resultsData) {
    return (
      <PracticeResults
        {...resultsData}
        onNewSession={() => {
          setShowResults(false);
          handleReset();
        }}
        onComplete={onComplete}
      />
    );
  }

  return <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-mint border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Historical Practice Trading
              </h3>
              <p className="text-sm text-white">
                Trading as of {format(new Date(practiceDate), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {portfolio.stocks.length > 0 && (
          <Button variant="default" size="sm" onClick={handleFastForward} disabled={isUpdatingPrices}>
                <FastForward className="w-4 h-4 mr-2" />
                Fast Forward to Today
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>


        {/* Portfolio Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-card/50 rounded-lg p-4">
            <p className="text-sm text-white mb-1">Total Value</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{portfolioValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-4">
            <p className="text-sm text-white mb-1">Available Cash</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{portfolio.cash.toLocaleString()}
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-4">
            <p className="text-sm text-white mb-1">Gain/Loss</p>
            <p className={`text-2xl font-bold ${gainLoss >= 0 ? "text-success" : "text-destructive"}`}>
              {gainLoss >= 0 ? "+" : ""}₹{Math.abs(gainLoss).toLocaleString()}
            </p>
            <p className="text-xs text-white">
              ({gainLossPercent >= 0 ? "+" : ""}
              {gainLossPercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Suggested Stocks */}
        <div className="mt-4">
          <p className="text-sm text-white mb-2">Suggested stocks for this lesson:</p>
          <div className="flex gap-2 flex-wrap">
            {practiceStocks.map(stock => <Badge key={stock} variant="secondary">
                {stock.replace(".NS", "")}
              </Badge>)}
          </div>
        </div>
      </Card>

      {/* Trading Interface */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Stock List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Suggested Stocks
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click on a stock to view historical data and make trades
            </p>
            
            {loadingStockDetail ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Loading stock data...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedStocks.map((stock) => (
                  <Card
                    key={stock.symbol}
                    className={`p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary/50 ${
                      selectedStock?.symbol === stock.symbol ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleStockClick(stock.symbol, stock.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {stock.symbol.replace('.NS', '')}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
                      </div>
                      
                      <div className="text-right ml-2">
                        <p className="text-sm text-muted-foreground">Click to view</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Stock Detail or Holdings/History */}
        <div className="lg:col-span-2">
          {selectedStock ? (
            <div className="space-y-4">
              <StockDetailView
                symbol={selectedStock.symbol}
                name={selectedStock.name}
                historicalPrice={selectedStock.price}
                practiceDate={practiceDate}
                onBack={() => setSelectedStock(null)}
                onTrade={() => {
                  handleTradeClick(selectedStock.symbol, selectedStock.name, selectedStock.price);
                  setSelectedStock(null); // Hide graph after clicking trade
                }}
              />
            </div>
          ) : (
            <Tabs defaultValue="holdings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="holdings">Holdings ({portfolio.stocks.length})</TabsTrigger>
                <TabsTrigger value="history">History ({portfolio.transactions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="holdings" className="mt-6">
                {portfolio.stocks.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-2 text-foreground">No Holdings Yet</h3>
                      <p className="text-muted-foreground">
                        Start building your portfolio by selecting and buying stocks from the list
                      </p>
                    </div>
                  </Card>
                ) : (
                  <HoldingsTable stocks={portfolio.stocks} onTradeClick={handleTradeClick} />
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                {portfolio.transactions.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold mb-2 text-foreground">No Transactions Yet</h3>
                      <p className="text-muted-foreground">
                        Your trade history will appear here once you start trading
                      </p>
                    </div>
                  </Card>
                ) : (
                  <TransactionHistory transactions={portfolio.transactions} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Complete Button */}
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Once you're comfortable with the concepts, complete the lesson to earn XP!
          </p>
          <Button onClick={onComplete} size="lg" className="min-w-48">
            Complete Lesson
          </Button>
        </div>
      </Card>

      {/* Practice Trade Dialog */}
      <PracticeTradeDialog 
        open={tradeDialog.open} 
        onClose={() => setTradeDialog({ ...tradeDialog, open: false })} 
        symbol={tradeDialog.symbol} 
        name={tradeDialog.name} 
        currentPrice={tradeDialog.price} 
        portfolio={portfolio}
        practiceDate={practiceDate}
        onTradeComplete={handleTradeComplete} 
      />
    </div>;
};
export default PracticeTradingMode;