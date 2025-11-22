import { Card } from "@/components/ui/card";
import { Transaction } from "@/utils/portfolioStorage";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { format } from "date-fns";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Transactions Yet</h3>
          <p className="text-sm text-muted-foreground">
            Your trading history will appear here once you make your first trade.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <p className="text-sm text-muted-foreground">Last {Math.min(transactions.length, 20)} trades</p>
      </div>
      
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {transactions.slice(0, 20).map((transaction) => {
          const isBuy = transaction.type === 'buy';
          
          return (
            <div key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${isBuy ? 'bg-success/10' : 'bg-destructive/10'} flex items-center justify-center`}>
                    {isBuy ? (
                      <ArrowDownLeft className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isBuy ? 'text-success' : 'text-destructive'}`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {transaction.symbol}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.quantity} shares @ ₹{transaction.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${isBuy ? 'text-destructive' : 'text-success'}`}>
                    {isBuy ? '-' : '+'}₹{transaction.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TransactionHistory;
