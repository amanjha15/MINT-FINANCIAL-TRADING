import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { useTrades, useHoldings, usePortfolio } from "@/hooks/useSupabase";
import { useMemo } from "react";
import { formatINR } from "@/utils/currencyConverter";
interface TradingHistoryProps {
  userId: string;
}
export const TradingHistory = ({
  userId
}: TradingHistoryProps) => {
  const {
    data: trades = [],
    isLoading: tradesLoading
  } = useTrades(userId);
  const {
    data: holdings = [],
    isLoading: holdingsLoading
  } = useHoldings(userId);
  const {
    data: portfolio,
    isLoading: portfolioLoading
  } = usePortfolio(userId);
  const loading = tradesLoading || holdingsLoading || portfolioLoading;

  // Calculate total value and gain/loss with memoization
  const {
    totalValue,
    totalGainLoss
  } = useMemo(() => {
    const stocksValue = holdings.reduce((sum, h) => sum + h.current_price * h.quantity, 0);
    const cash = portfolio?.cash || 0;
    const totalVal = cash + stocksValue;
    return {
      totalValue: totalVal,
      totalGainLoss: totalVal - 100000 // 100000 is initial cash
    };
  }, [holdings, portfolio]);
  if (loading) {
    return <div className="text-center text-muted-foreground">Loading trading data...</div>;
  }
  return <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-bold text-foreground">
                {formatINR(totalValue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3">
            
            <div>
              <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-success" : "text-destructive"}`}>
                {totalGainLoss >= 0 ? "+" : "-"}{formatINR(Math.abs(totalGainLoss))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/20">
          <div className="flex items-center gap-3">
            
            <div>
              <p className="text-sm text-muted-foreground">Active Holdings</p>
              <p className="text-2xl font-bold text-foreground">{holdings.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Holdings */}
      <Card className="p-6 bg-card border-border/20">
        <h3 className="text-xl font-sentient font-bold text-foreground mb-4">
          Current Holdings
        </h3>
        {holdings.length === 0 ? <p className="text-muted-foreground text-center py-8">
            No current holdings. Start trading to build your portfolio!
          </p> : <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Gain/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map(holding => {
              const gainLoss = (holding.current_price - holding.purchase_price) * holding.quantity;
              const gainLossPercent = (holding.current_price - holding.purchase_price) / holding.purchase_price * 100;
              return <TableRow key={holding.id}>
                      <TableCell className="font-mono font-bold">
                        {holding.symbol}
                      </TableCell>
                      <TableCell>{holding.quantity}</TableCell>
                      <TableCell>
                        {formatINR(holding.purchase_price)}
                      </TableCell>
                      <TableCell>{formatINR(holding.current_price)}</TableCell>
                      <TableCell>
                        {formatINR(holding.current_price * holding.quantity)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={gainLoss >= 0 ? "default" : "destructive"} className={gainLoss >= 0 ? "bg-success text-success-foreground" : ""}>
                          {gainLoss >= 0 ? "+" : "-"}{formatINR(Math.abs(gainLoss))} (
                          {gainLossPercent.toFixed(2)}%)
                        </Badge>
                      </TableCell>
                    </TableRow>;
            })}
              </TableBody>
            </Table>
          </div>}
      </Card>

      {/* Recent Trades */}
      <Card className="p-6 bg-card border-border/20">
        <h3 className="text-xl font-sentient font-bold text-foreground mb-4">
          Recent Trades
        </h3>
        {trades.length === 0 ? <p className="text-muted-foreground text-center py-8">
            No trades yet. Visit the simulator to start trading!
          </p> : <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map(trade => <TableRow key={trade.id}>
                    <TableCell>
                      {new Date(trade.traded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.trade_type === "buy" ? "default" : "secondary"} className={trade.trade_type === "buy" ? "bg-success text-success-foreground" : ""}>
                        {trade.trade_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell>{formatINR(trade.price)}</TableCell>
                    <TableCell>{formatINR(trade.total)}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </Card>
    </div>;
};