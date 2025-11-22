import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface Trade {
  id: string;
  symbol: string;
  stock_name: string;
  trade_type: string;
  quantity: number;
  price_at_trade: number;
  price_at_completion: number | null;
  total_cost: number;
  gain_loss_amount: number | null;
  gain_loss_percent: number | null;
}

interface PracticeResultsProps {
  practiceDate: string;
  practiceEndDate?: string;
  initialCash: number;
  finalCash: number;
  totalValue: number;
  gainLossAmount: number;
  gainLossPercent: number;
  trades: Trade[];
  onNewSession: () => void;
  onComplete: () => void;
}

const PracticeResults = ({
  practiceDate,
  practiceEndDate,
  initialCash,
  finalCash,
  totalValue,
  gainLossAmount,
  gainLossPercent,
  trades,
  onNewSession,
  onComplete
}: PracticeResultsProps) => {
  const isProfit = gainLossAmount >= 0;
  // Ensure end date defaults to today if not provided
  const endDate = practiceEndDate || new Date().toISOString();
  
  // Parse dates correctly
  const startDate = new Date(practiceDate);
  const finalDate = new Date(endDate);

  return (
    <div className="space-y-6">
      {/* Header with overall performance */}
      <Card className={`p-6 border-2 ${isProfit ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'}`}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isProfit ? 'bg-success/20' : 'bg-destructive/20'}`}>
              {isProfit ? (
                <TrendingUp className="w-8 h-8 text-success" />
              ) : (
                <TrendingDown className="w-8 h-8 text-destructive" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isProfit ? "Great Trading!" : "Learning Experience"}
            </h2>
            <p className="text-muted-foreground">
              Trades from {format(startDate, "MMM dd, yyyy")} to {format(finalDate, "MMM dd, yyyy")}
            </p>
          </div>

          <div className={`text-5xl font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
            {isProfit ? '+' : ''}₹{Math.abs(gainLossAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>

          <Badge variant={isProfit ? "default" : "destructive"} className="text-lg px-4 py-2">
            {isProfit ? '+' : ''}{gainLossPercent.toFixed(2)}% Return
          </Badge>
        </div>
      </Card>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Trading Period</p>
          </div>
          <p className="text-lg font-bold text-foreground">
            {format(startDate, "MMM dd")} - {format(finalDate, "MMM dd, yyyy")}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Initial Capital</p>
          </div>
          <p className="text-xl font-bold text-foreground">
            ₹{initialCash.toLocaleString('en-IN')}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Final Value</p>
          </div>
          <p className="text-xl font-bold text-foreground">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Individual Trade Results */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trade Performance Breakdown
        </h3>

        <div className="space-y-3">
          {trades.map((trade) => {
            const tradeProfit = trade.gain_loss_amount || 0;
            const tradeIsProfit = tradeProfit >= 0;

            return (
              <Card key={trade.id} className="p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{trade.symbol}</h4>
                      <Badge variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}>
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {trade.quantity} shares
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Price at Trade</p>
                        <p className="font-semibold text-foreground">
                          ₹{trade.price_at_trade.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Price</p>
                        <p className="font-semibold text-foreground">
                          ₹{(trade.price_at_completion || trade.price_at_trade).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className={`text-2xl font-bold ${tradeIsProfit ? 'text-success' : 'text-destructive'}`}>
                      {tradeIsProfit ? '+' : ''}₹{Math.abs(tradeProfit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm ${tradeIsProfit ? 'text-success' : 'text-destructive'}`}>
                      {tradeIsProfit ? '+' : ''}{(trade.gain_loss_percent || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Learning Insights */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold text-foreground mb-3">💡 Key Takeaway</h3>
        <p className="text-muted-foreground mb-4">
          {isProfit ? (
            <>
              Excellent work! Your trades generated a positive return. Remember, past performance 
              doesn't guarantee future results, but this shows good analysis of the market conditions 
              at that time.
            </>
          ) : (
            <>
              Every trader experiences losses. The key is learning from them. Review what happened 
              in the market after your trades and consider what signals you might have missed.
            </>
          )}
        </p>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button onClick={onNewSession} size="lg" variant="outline" className="min-w-48">
          Start New Practice Session
        </Button>
        <Button onClick={onComplete} size="lg" className="min-w-48">
          Complete Lesson
        </Button>
      </div>
    </div>
  );
};

export default PracticeResults;