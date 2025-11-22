import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Portfolio, buyStock, sellStock } from "@/utils/portfolioStorage";

interface TradeDialogProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
  currentPrice: number;
  portfolio: Portfolio;
  onTradeComplete: (portfolio: Portfolio) => void;
}

const TradeDialog = ({ 
  open, 
  onClose, 
  symbol, 
  name, 
  currentPrice, 
  portfolio,
  onTradeComplete 
}: TradeDialogProps) => {
  const [quantity, setQuantity] = useState<string>("1");
  const [error, setError] = useState<string>("");

  const ownedStock = portfolio.stocks.find(s => s.symbol === symbol);
  const quantityNum = parseInt(quantity) || 0;
  const totalCost = quantityNum * currentPrice;

  const handleBuy = async () => {
    setError("");
    
    if (quantityNum <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    const result = await buyStock(portfolio, symbol, name, quantityNum, currentPrice);
    
    if (result.success && result.portfolio) {
      onTradeComplete(result.portfolio);
      onClose();
      setQuantity("1");
    } else {
      setError(result.message);
    }
  };

  const handleSell = async () => {
    setError("");
    
    if (quantityNum <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    const result = await sellStock(portfolio, symbol, quantityNum, currentPrice);
    
    if (result.success && result.portfolio) {
      onTradeComplete(result.portfolio);
      onClose();
      setQuantity("1");
    } else {
      setError(result.message);
    }
  };

  const maxBuyQuantity = Math.floor(portfolio.cash / currentPrice);
  const maxSellQuantity = ownedStock?.quantity || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{symbol}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Price */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Price</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Holdings Info */}
          {ownedStock && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                You own {ownedStock.quantity} shares
              </p>
              <p className="text-xs text-muted-foreground">
                Avg. price: ₹{ownedStock.purchasePrice.toFixed(2)}
              </p>
            </div>
          )}

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="gap-2" disabled={!ownedStock}>
                <TrendingDown className="w-4 h-4" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="buy-quantity">Quantity</Label>
                <Input
                  id="buy-quantity"
                  type="number"
                  min="1"
                  max={maxBuyQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
                <p className="text-xs text-muted-foreground">
                  Max: {maxBuyQuantity.toLocaleString()} shares (₹{portfolio.cash.toLocaleString('en-IN')} available)
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-semibold text-foreground">
                    ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash After Purchase</span>
                  <span className={`font-semibold ${portfolio.cash - totalCost >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ₹{(portfolio.cash - totalCost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                onClick={handleBuy} 
                className="w-full" 
                size="lg"
                disabled={quantityNum <= 0 || totalCost > portfolio.cash}
              >
                Buy {quantityNum} Share{quantityNum !== 1 ? 's' : ''}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="sell-quantity">Quantity</Label>
                <Input
                  id="sell-quantity"
                  type="number"
                  min="1"
                  max={maxSellQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
                <p className="text-xs text-muted-foreground">
                  Max: {maxSellQuantity} shares available
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-semibold text-foreground">
                    ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {ownedStock && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit/Loss</span>
                    <span className={`font-semibold ${(currentPrice - ownedStock.purchasePrice) * quantityNum >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ₹{((currentPrice - ownedStock.purchasePrice) * quantityNum).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                onClick={handleSell} 
                variant="secondary"
                className="w-full" 
                size="lg"
                disabled={quantityNum <= 0 || quantityNum > maxSellQuantity}
              >
                Sell {quantityNum} Share{quantityNum !== 1 ? 's' : ''}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeDialog;
