import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { Stock } from "@/utils/portfolioStorage";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface HoldingsTableProps {
  stocks: Stock[];
  onTradeClick: (symbol: string, name: string, price: number) => void;
}

const HoldingsTable = ({ stocks, onTradeClick }: HoldingsTableProps) => {
  if (stocks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No Holdings Yet</h3>
          <p className="text-muted-foreground">
            Start building your portfolio by searching and buying stocks above.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-semibold text-sm text-muted-foreground">Stock</th>
              <th className="text-right p-4 font-semibold text-sm text-muted-foreground">Quantity</th>
              <th className="text-right p-4 font-semibold text-sm text-muted-foreground">Avg. Price</th>
              <th className="text-right p-4 font-semibold text-sm text-muted-foreground">Current Price</th>
              <th className="text-right p-4 font-semibold text-sm text-muted-foreground">Total Value</th>
              <th className="text-right p-4 font-semibold text-sm text-muted-foreground">Gain/Loss</th>
              <th className="text-center p-4 font-semibold text-sm text-muted-foreground">Chart</th>
              <th className="text-right p-4 font-semibold text-sm text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stocks.map((stock) => {
              const totalValue = stock.currentPrice * stock.quantity;
              const totalCost = stock.purchasePrice * stock.quantity;
              const gainLoss = totalValue - totalCost;
              const gainLossPercent = ((gainLoss / totalCost) * 100);
              const isPositive = gainLoss >= 0;

              // Generate mini chart data
              const chartData = Array.from({ length: 7 }, (_, i) => ({
                value: stock.currentPrice * (1 + (Math.random() - 0.5) * 0.05)
              }));

              return (
                <tr key={stock.symbol} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-foreground">{stock.symbol}</p>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                  </td>
                  <td className="p-4 text-right text-foreground">{stock.quantity}</td>
                  <td className="p-4 text-right text-foreground">
                    ₹{stock.purchasePrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-semibold text-foreground">
                    ₹{stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-semibold text-foreground">
                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-4 text-right">
                    <div className={`${isPositive ? 'text-success' : 'text-destructive'}`}>
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isPositive ? '+' : ''}₹{Math.abs(gainLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <p className="text-sm">
                        {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="w-20 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTradeClick(stock.symbol, stock.name, stock.currentPrice)}
                    >
                      Trade
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default HoldingsTable;
