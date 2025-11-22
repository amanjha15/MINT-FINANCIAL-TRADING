import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Calendar, BarChart3, Loader2 } from "lucide-react";
import LessonStockChart from "./LessonStockChart";
import { format, subDays } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StockDetailViewProps {
  symbol: string;
  name: string;
  historicalPrice: number;
  practiceDate: string;
  onBack: () => void;
  onTrade: () => void;
}

const StockDetailView = ({
  symbol,
  name,
  historicalPrice,
  practiceDate,
  onBack,
  onTrade
}: StockDetailViewProps) => {
  const practiceDateTime = useMemo(() => new Date(practiceDate), [practiceDate]);
  const chartStartDate = useMemo(() => subDays(practiceDateTime, 30), [practiceDateTime]);
  const displaySymbol = symbol.replace('.NS', '');
  const [actualStartPrice, setActualStartPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    const fetchStartPrice = async () => {
      try {
        setLoadingPrice(true);
        const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
          body: {
            symbol,
            period: 'custom',
            startDate: chartStartDate.toISOString(),
            endDate: practiceDate
          }
        });

        if (error) throw error;

        if (data.success && data.data && data.data.length > 0) {
          // Get the first data point (earliest date)
          const firstPoint = data.data[0];
          setActualStartPrice(firstPoint.close || firstPoint.price);
        } else {
          // Fallback to prop if no data
          setActualStartPrice(historicalPrice);
        }
      } catch (error) {
        console.error('Error fetching start price:', error);
        setActualStartPrice(historicalPrice);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchStartPrice();
  }, [symbol, chartStartDate, practiceDate, historicalPrice]);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button 
          onClick={onTrade} 
          size="lg"
          className="gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Trade Stock
        </Button>
      </div>

      {/* Stock Info Card */}
      <Card className="p-6 bg-gradient-mint border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-foreground">
                {displaySymbol}
              </h2>
              <Badge variant="secondary" className="text-xs">
                Practice Mode
              </Badge>
            </div>
            <p className="text-white text-base mb-4">{name}</p>
            
            <div className="flex items-center gap-2 text-sm text-white">
              <Calendar className="w-4 h-4" />
              <span>Historical data from {format(practiceDateTime, "MMMM dd, yyyy")}</span>
            </div>
          </div>

          <div className="bg-card/50 rounded-lg p-6 min-w-[200px]">
            <p className="text-sm text-white mb-1">Starting Price ({format(chartStartDate, "MMM dd")})</p>
            {loadingPrice ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-2xl font-bold text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <p className="text-4xl font-bold text-foreground">
                ₹{(actualStartPrice || historicalPrice).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Chart Component - Let it handle its own layout */}
      <LessonStockChart 
        symbol={symbol}
        name={name}
        startDate={chartStartDate.toISOString()}
        endDate={practiceDate}
      />

      {/* Action Button - Mobile Only */}
      <div className="md:hidden">
        <Button 
          onClick={onTrade} 
          size="lg" 
          className="w-full gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Trade This Stock
        </Button>
      </div>
    </div>
  );
};

export default StockDetailView;
