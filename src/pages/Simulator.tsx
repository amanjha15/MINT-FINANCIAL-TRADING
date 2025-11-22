import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, RotateCcw, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PortfolioSummary from "@/components/simulator/PortfolioSummary";
import StockSearch from "@/components/simulator/StockSearch";
import TradeDialog from "@/components/simulator/TradeDialog";
import HoldingsTable from "@/components/simulator/HoldingsTable";
import TransactionHistory from "@/components/simulator/TransactionHistory";
import StockChart from "@/components/simulator/StockChart";
import { 
  getPortfolio, 
  resetPortfolio, 
  updateStockPrices, 
  Portfolio 
} from "@/utils/portfolioStorage";
import { getMultipleQuotes, subscribeToStockUpdates } from "@/utils/marketData";

const Simulator = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [portfolio, setPortfolio] = useState<Portfolio>({
    cash: 100000,
    stocks: [],
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(
    searchParams.get('symbol') 
      ? { symbol: searchParams.get('symbol')!, name: searchParams.get('name') || searchParams.get('symbol')! }
      : null
  );
  const [tradeDialog, setTradeDialog] = useState<{
    open: boolean;
    symbol: string;
    name: string;
    price: number;
  }>({
    open: false,
    symbol: "",
    name: "",
    price: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    usMarket: boolean;
    indianMarket: boolean;
    isWeekend: boolean;
  } | null>(null);

  // Load portfolio on mount and get initial market status
  useEffect(() => {
    const loadPortfolio = async () => {
      const data = await getPortfolio();
      setPortfolio(data);
      
      // Fetch market status
      if (data.stocks.length > 0) {
        try {
          const symbols = data.stocks.map(s => s.symbol).slice(0, 1); // Just check with one stock
          const { data: statusData } = await supabase.functions.invoke('fetch-stock-data', {
            body: { symbols }
          });
          
          if (statusData?.marketStatus) {
            setMarketStatus(statusData.marketStatus);
          }
        } catch (error) {
          console.error('Failed to fetch market status:', error);
        }
      }
      
      setIsLoading(false);
    };
    loadPortfolio();
  }, []);

  // Update stock prices periodically
  useEffect(() => {
    const updatePrices = async () => {
      if (portfolio.stocks.length === 0) return;
      
      const symbols = portfolio.stocks.map(s => s.symbol);
      const quotes = await getMultipleQuotes(symbols);
      
      const prices: { [symbol: string]: number } = {};
      Object.entries(quotes).forEach(([symbol, quote]) => {
        prices[symbol] = quote.price;
      });
      
      const updatedPortfolio = await updateStockPrices(portfolio, prices);
      setPortfolio(updatedPortfolio);
    };

    // Initial update
    updatePrices();

    // Subscribe to real-time updates
    const symbols = portfolio.stocks.map(s => s.symbol);
    if (symbols.length > 0) {
      const unsubscribe = subscribeToStockUpdates(symbols, async (updates) => {
        const updatedPortfolio = await updateStockPrices(portfolio, updates);
        setPortfolio(updatedPortfolio);
      });

      return unsubscribe;
    }
  }, [portfolio.stocks.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing market data...");
    
    try {
      if (portfolio.stocks.length > 0) {
        const symbols = portfolio.stocks.map(s => s.symbol);
        
        // Call the edge function directly to force refresh and get market status
        const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
          body: { symbols }
        });
        
        if (error) throw error;
        
        if (data.success && data.marketStatus) {
          setMarketStatus(data.marketStatus);
        }
        
        if (data.success && data.data) {
          const prices: { [symbol: string]: number } = {};
          Object.entries(data.data).forEach(([symbol, quote]: [string, any]) => {
            prices[symbol] = quote.price;
          });
          
          const updatedPortfolio = await updateStockPrices(portfolio, prices);
          setPortfolio(updatedPortfolio);
          
          const cacheInfo = data.cached > 0 
            ? `${data.fetched} fetched, ${data.cached} from cache` 
            : `${data.fetched} stocks updated`;
          toast.success(`Market data refreshed! (${cacheInfo})`);
        }
      } else {
        toast.success("No holdings to refresh");
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error("Failed to refresh market data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset your portfolio? This will clear all holdings and transactions.")) {
      const newPortfolio = await resetPortfolio();
      // Force state update with a completely fresh object to avoid any caching
      setPortfolio({
        cash: newPortfolio.cash,
        stocks: [],
        transactions: []
      });
      toast.success("Portfolio reset successfully!");
    }
  };

  const handleSelectStock = (symbol: string, name: string, price: number) => {
    setSelectedStock({ symbol, name });
    setSearchParams({ symbol, name });
  };
  
  const handleTradeClick = (symbol: string, name: string, price: number) => {
    setTradeDialog({
      open: true,
      symbol,
      name,
      price
    });
  };

  const handleTradeComplete = (updatedPortfolio: Portfolio) => {
    setPortfolio(updatedPortfolio);
    toast.success("Trade executed successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Trading Simulator</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Practice with ₹1,00,000 virtual cash</p>
                  {marketStatus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${marketStatus.isOpen ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {marketStatus.isOpen ? '● Market Open' : '○ Market Closed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || portfolio.stocks.length === 0}
                title={portfolio.stocks.length === 0 ? "No holdings to refresh" : "Refresh stock prices"}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Portfolio Summary */}
        <PortfolioSummary portfolio={portfolio} />

        {selectedStock ? (
          /* Stock Detail View with Chart */
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStock(null);
                  setSearchParams({});
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trading
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  const quotes = await getMultipleQuotes([selectedStock.symbol]);
                  const quote = quotes[selectedStock.symbol];
                  if (quote) {
                    handleTradeClick(selectedStock.symbol, selectedStock.name, quote.price);
                  }
                }}
              >
                Trade {selectedStock.symbol}
              </Button>
            </div>
            
            <StockChart symbol={selectedStock.symbol} name={selectedStock.name} />
          </div>
        ) : (
          /* Trading Interface */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Stock Search */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Search & Trade</h2>
                <StockSearch onSelectStock={handleSelectStock} />
              </Card>
            </div>

            {/* Holdings & Transactions */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="holdings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="holdings">
                    Holdings ({portfolio.stocks.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    History ({portfolio.transactions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="holdings" className="mt-6">
                  <HoldingsTable 
                    stocks={portfolio.stocks} 
                    onTradeClick={handleTradeClick}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <TransactionHistory transactions={portfolio.transactions} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Trade Dialog */}
      <TradeDialog
        open={tradeDialog.open}
        onClose={() => setTradeDialog({ ...tradeDialog, open: false })}
        symbol={tradeDialog.symbol}
        name={tradeDialog.name}
        currentPrice={tradeDialog.price}
        portfolio={portfolio}
        onTradeComplete={handleTradeComplete}
      />
    </div>
  );
};

export default Simulator;
