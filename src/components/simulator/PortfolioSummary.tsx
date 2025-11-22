import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity } from "lucide-react";
import { Portfolio, getPortfolioValue, getPortfolioGainLoss } from "@/utils/portfolioStorage";
interface PortfolioSummaryProps {
  portfolio: Portfolio;
}
const PortfolioSummary = ({
  portfolio
}: PortfolioSummaryProps) => {
  const totalValue = getPortfolioValue(portfolio);
  const {
    amount,
    percentage
  } = getPortfolioGainLoss(portfolio);
  const stocksValue = totalValue - portfolio.cash;
  const isPositive = amount >= 0;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Portfolio Value */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Value</p>
            <h3 className="text-2xl font-bold text-foreground">
              ₹{totalValue.toLocaleString('en-IN', {
              maximumFractionDigits: 0
            })}
            </h3>
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">
                {isPositive ? '+' : ''}₹{Math.abs(amount).toLocaleString('en-IN', {
                maximumFractionDigits: 0
              })}
              </span>
              <span>({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)</span>
            </div>
          </div>
          
        </div>
      </Card>

      {/* Cash Balance */}
      <Card className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cash Balance</p>
            <h3 className="text-2xl font-bold text-foreground">
              ₹{portfolio.cash.toLocaleString('en-IN', {
              maximumFractionDigits: 0
            })}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {(portfolio.cash / totalValue * 100).toFixed(1)}% of portfolio
            </p>
          </div>
          
        </div>
      </Card>

      {/* Stocks Value */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Stocks Value</p>
            <h3 className="text-2xl font-bold text-foreground">
              ₹{stocksValue.toLocaleString('en-IN', {
              maximumFractionDigits: 0
            })}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {portfolio.stocks.length} position{portfolio.stocks.length !== 1 ? 's' : ''}
            </p>
          </div>
          
        </div>
      </Card>

      {/* Today's Change */}
      <Card className={`p-6 bg-gradient-to-br ${isPositive ? 'from-success/5 to-success/10 border-success/20' : 'from-destructive/5 to-destructive/10 border-destructive/20'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Gain/Loss</p>
            <h3 className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}₹{Math.abs(amount).toLocaleString('en-IN', {
              maximumFractionDigits: 0
            })}
            </h3>
            <p className={`text-sm mt-2 font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%
            </p>
          </div>
          
        </div>
      </Card>
    </div>;
};
export default PortfolioSummary;