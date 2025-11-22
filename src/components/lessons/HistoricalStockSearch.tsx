import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, TrendingUp } from "lucide-react";
import { searchStocks, getHistoricalPrice } from "@/utils/marketData";
import { Badge } from "@/components/ui/badge";

interface HistoricalStockSearchProps {
  onSelectStock: (symbol: string, name: string) => void;
  practiceDate: string;
  practiceStocks: string[];
}

const HistoricalStockSearch = ({ 
  onSelectStock, 
  practiceDate,
  practiceStocks 
}: HistoricalStockSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [prices, setPrices] = useState<{ [symbol: string]: number }>({});
  const [loading, setLoading] = useState(false);

  // Show suggested stocks by default
  useEffect(() => {
    const loadSuggestedStocks = async () => {
      if (practiceStocks.length > 0) {
        setLoading(true);
        const stocksWithNames = await Promise.all(
          practiceStocks.map(async (symbol) => {
            const searchResults = await searchStocks(symbol);
            return searchResults[0] || { symbol, name: symbol };
          })
        );
        setResults(stocksWithNames);
        
        // Fetch historical prices
        const historicalPrices: { [symbol: string]: number } = {};
        await Promise.all(
          practiceStocks.map(async (symbol) => {
            historicalPrices[symbol] = await getHistoricalPrice(symbol, practiceDate);
          })
        );
        setPrices(historicalPrices);
        setLoading(false);
      }
    };

    if (!query) {
      loadSuggestedStocks();
    }
  }, [practiceStocks, practiceDate, query]);

  // Search functionality
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        setResults([]);
        setPrices({});
        
        const searchResults = await searchStocks(query);
        setResults(searchResults.slice(0, 10));
        
        // Fetch historical prices for results
        const historicalPrices: { [symbol: string]: number } = {};
        await Promise.all(
          searchResults.slice(0, 10).map(async (result) => {
            historicalPrices[result.symbol] = await getHistoricalPrice(result.symbol, practiceDate);
          })
        );
        setPrices(historicalPrices);
        setLoading(false);
      } else if (query.length === 0) {
        // Reload suggested stocks when query is cleared
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(searchDebounce);
  }, [query, practiceDate]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stocks or select from suggested..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {!query && results.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested for this lesson:</p>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground text-center py-4">Loading prices...</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result) => {
            const price = prices[result.symbol];

            return (
              <Card
                key={result.symbol}
                className="p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  if (price) {
                    onSelectStock(result.symbol, result.name);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {result.symbol}
                      </h4>
                      {practiceStocks.includes(result.symbol) && (
                        <Badge variant="secondary" className="text-xs">
                          Suggested
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.name}</p>
                  </div>
                  
                  <div className="text-right">
                    {price ? (
                      <>
                        <p className="text-lg font-bold text-foreground">
                          ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">Historical</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No stocks found. Try searching for suggested stocks above.
        </p>
      )}
    </div>
  );
};

export default HistoricalStockSearch;
