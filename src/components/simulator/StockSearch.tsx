import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { searchStocks, getStockQuote, StockQuote } from "@/utils/marketData";

interface StockSearchProps {
  onSelectStock: (symbol: string, name: string, price: number) => void;
}

const StockSearch = ({ onSelectStock }: StockSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([]);
  const [quotes, setQuotes] = useState<{ [symbol: string]: StockQuote }>({});
  const [loading, setLoading] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Debounced search - only search for symbols
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        setResults([]);
        setQuotes({});
        const searchResults = await searchStocks(query);
        setResults(searchResults.slice(0, 10)); // Limit to 10 results
        setLoading(false);
        
        // Fetch quotes only for top results in background
        if (searchResults.length > 0) {
          setLoadingQuotes(true);
          const topSymbols = searchResults.slice(0, 10).map(r => r.symbol);
          
          // Fetch in batches to avoid overwhelming the API
          const batchSize = 5;
          for (let i = 0; i < topSymbols.length; i += batchSize) {
            const batch = topSymbols.slice(i, i + batchSize);
            const batchQuotes: { [symbol: string]: StockQuote } = {};
            
            await Promise.all(
              batch.map(async (symbol) => {
                const quote = await getStockQuote(symbol);
                batchQuotes[symbol] = quote;
              })
            );
            
            setQuotes(prev => ({ ...prev, ...batchQuotes }));
          }
          setLoadingQuotes(false);
        }
      } else {
        setResults([]);
        setQuotes({});
        setLoading(false);
      }
    }, 500); // Increased debounce to 500ms for better performance

    return () => clearTimeout(searchDebounce);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stocks (e.g., AAPL, RELIANCE.NS, TCS.NS)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 text-white"
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result) => {
            const quote = quotes[result.symbol];

            return (
              <Card
                key={result.symbol}
                className="p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  if (quote) {
                    onSelectStock(result.symbol, result.name, quote.price);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {result.symbol}
                      </h4>
                      {quote && (
                        <span className={`text-xs px-2 py-0.5 rounded ${quote.changePercent >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.name}</p>
                  </div>
                  
                  <div className="text-right">
                    {quote ? (
                      <>
                        <p className="text-lg font-bold text-foreground">
                          ₹{quote.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <div className={`flex items-center gap-1 text-sm ${quote.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {quote.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{quote.changePercent >= 0 ? '+' : ''}₹{Math.abs(quote.change).toFixed(2)}</span>
                        </div>
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
      
      {loadingQuotes && !loading && (
        <p className="text-xs text-muted-foreground text-center py-2">Loading prices...</p>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No stocks found. Try searching for AAPL, RELIANCE.NS, or TCS.NS
        </p>
      )}
    </div>
  );
};

export default StockSearch;
