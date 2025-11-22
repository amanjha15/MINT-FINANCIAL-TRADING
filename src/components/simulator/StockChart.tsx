import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar, CartesianGrid, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Loader2, TrendingUp, TrendingDown, Activity, Info } from "lucide-react";
import { getHistoricalData, getDetailedQuote, IntradayDataPoint, DetailedStockQuote } from "@/utils/yahooFinance";
import { format } from "date-fns";
import { isUSStock } from "@/utils/currencyConverter";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TimePeriod = '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y' | 'max';

interface StockChartProps {
  symbol: string;
  name: string;
}

const StockChart = ({ symbol, name }: StockChartProps) => {
  const [period, setPeriod] = useState<TimePeriod>('1d');
  const [chartData, setChartData] = useState<IntradayDataPoint[]>([]);
  const [stockInfo, setStockInfo] = useState<DetailedStockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMA, setShowMA] = useState(true);
  
  // Market status calculation
  const marketStatus = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const estOffset = -5;
    const estHours = (utcHours + estOffset + 24) % 24;
    const totalMinutes = estHours * 60 + utcMinutes;
    
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = !isWeekend && totalMinutes >= (9 * 60 + 30) && totalMinutes < (16 * 60);
    
    let lastDataDate = '';
    if (chartData.length > 0) {
      const lastTimestamp = chartData[chartData.length - 1].timestamp;
      lastDataDate = format(new Date(lastTimestamp), 'MMM d, yyyy h:mm a');
    }
    
    return {
      isOpen: isMarketHours,
      isWeekend,
      lastDataDate,
      statusText: isMarketHours ? 'Market Open' : isWeekend ? 'Market Closed (Weekend)' : 'Market Closed'
    };
  }, [chartData]);

  // Calculate moving averages
  const enrichedData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    return chartData.map((point, index, array) => {
      // Calculate 20-period MA (short-term)
      let ma20 = null;
      if (index >= 19) {
        const sum = array.slice(index - 19, index + 1).reduce((acc, p) => acc + p.price, 0);
        ma20 = sum / 20;
      }
      
      // Calculate 50-period MA (medium-term)
      let ma50 = null;
      if (index >= 49) {
        const sum = array.slice(index - 49, index + 1).reduce((acc, p) => acc + p.price, 0);
        ma50 = sum / 50;
      }
      
      return {
        ...point,
        ma20,
        ma50,
      };
    });
  }, [chartData]);

  // Calculate price range for better visualization
  const priceStats = useMemo(() => {
    if (enrichedData.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const prices = enrichedData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return { min, max, avg };
  }, [enrichedData]);

  useEffect(() => {
    loadStockData();
    
    // Dynamic refresh based on market status
    // Refresh every 30 seconds during market hours, every 5 minutes when closed
    const refreshInterval = marketStatus.isOpen ? 30000 : 300000;
    const interval = setInterval(loadStockData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [symbol, period, marketStatus.isOpen]);

  const loadStockData = async () => {
    try {
      setLoading(true);
      
      // Force fresh data from database during market hours
      const forceFresh = marketStatus.isOpen;
      
      // Fetch real-time quote from database first
      const quote = await getDetailedQuote(symbol);
      setStockInfo(quote);
      
      // Then fetch historical data for charting
      const historical = await getHistoricalData(symbol, period);
      setChartData(historical);
      
      // Log volume data for debugging
      const volumeStats = historical.length > 0 ? {
        hasVolume: historical.some(d => d.volume && d.volume > 0),
        totalPoints: historical.length,
        pointsWithVolume: historical.filter(d => d.volume && d.volume > 0).length,
        sampleVolume: historical[0]?.volume || 0
      } : {};
      
      console.log(`Loaded ${historical.length} data points for ${symbol}`, {
        period,
        marketOpen: marketStatus.isOpen,
        lastUpdate: new Date().toLocaleTimeString(),
        volumeStats
      });
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp: number) => {
    if (period === '1d') {
      return format(new Date(timestamp), 'h:mm a');
    } else if (period === '5d') {
      return format(new Date(timestamp), 'EEE ha');
    } else if (period === '1mo') {
      return format(new Date(timestamp), 'MMM d');
    }
    return format(new Date(timestamp), 'MMM yyyy');
  };

  const formatDetailedDate = (timestamp: number) => {
    if (period === '1d') {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    }
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  const formatPrice = (value: number) => {
    const isUS = isUSStock(symbol);
    const currencySymbol = isUS ? '$' : '₹';
    return `${currencySymbol}${value.toFixed(2)}`;
  };

  const isPositive = stockInfo ? stockInfo.change >= 0 : true;
  const lineColor = isPositive ? "hsl(var(--chart-1))" : "hsl(var(--destructive))";

  if (loading && !stockInfo) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Stock Header */}
        <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{name}</h2>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                marketStatus.isOpen 
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
              }`}>
                {marketStatus.statusText}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{symbol}</p>
            {marketStatus.lastDataDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Latest: {marketStatus.lastDataDate}
                {marketStatus.isOpen && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="animate-pulse mr-1">•</span>
                    Live updates
                  </span>
                )}
              </p>
            )}
          </div>
          
          {stockInfo && (
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-bold text-foreground">
                {formatPrice(stockInfo.price)}
              </div>
              <div className={`flex items-center gap-2 ${isPositive ? 'text-chart-1' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-xl font-semibold">
                  {isPositive ? '+' : ''}{stockInfo.change.toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Period Selector */}
        <div className="mt-6">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList className="grid grid-cols-7 w-full max-w-2xl">
              <TabsTrigger value="1d">1D</TabsTrigger>
              <TabsTrigger value="5d">5D</TabsTrigger>
              <TabsTrigger value="1mo">1M</TabsTrigger>
              <TabsTrigger value="6mo">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="5y">5Y</TabsTrigger>
              <TabsTrigger value="max">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Real-Time Market Data</span>
            {loading && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            {showMA && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <div className="w-3 h-0.5 bg-blue-500" />
                      <span className="text-muted-foreground">MA20</span>
                      <Info className="w-3 h-3 text-muted-foreground/60" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">20-Day Moving Average</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Average closing price over the last 20 trading days. 
                      Helps identify short-term trends and support/resistance levels.
                    </p>
                  </TooltipContent>
                </UITooltip>
                
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <div className="w-3 h-0.5 bg-purple-500" />
                      <span className="text-muted-foreground">MA50</span>
                      <Info className="w-3 h-3 text-muted-foreground/60" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">50-Day Moving Average</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Average closing price over the last 50 trading days. 
                      Indicates medium-term trends and is often used to confirm trend direction.
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMA(!showMA)}
              className="h-7 text-xs"
            >
              {showMA ? 'Hide' : 'Show'} MA
            </Button>
          </div>
        </div>

        {/* Main Price Chart */}
        <div className="h-[450px] mb-4">
          {enrichedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                {/* Grid */}
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                  vertical={false}
                />
                
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  minTickGap={30}
                  interval="preserveStartEnd"
                />
                
                <YAxis
                  yAxisId="price"
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(value) => {
                    const isUS = isUSStock(symbol);
                    const currencySymbol = isUS ? '$' : '₹';
                    return `${currencySymbol}${value.toFixed(0)}`;
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={70}
                  orientation="right"
                />
                
                {/* Average Reference Line */}
                <ReferenceLine 
                  y={priceStats.avg} 
                  yAxisId="price"
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5" 
                  opacity={0.3}
                  label={{ 
                    value: `Avg: ${formatPrice(priceStats.avg)}`, 
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
                
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-muted-foreground">
                                {formatDetailedDate(data.timestamp)}
                              </span>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between items-center gap-4">
                                  <span className="text-xs text-muted-foreground">Price:</span>
                                  <span className="text-sm font-bold text-foreground">
                                    {formatPrice(data.price)}
                                  </span>
                                </div>
                                {data.volume && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-xs text-muted-foreground">Volume:</span>
                                    <span className="text-xs font-medium text-foreground">
                                      {(data.volume / 1000000).toFixed(2)}M
                                    </span>
                                  </div>
                                )}
                                {showMA && data.ma20 && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-xs text-blue-500">MA20:</span>
                                    <span className="text-xs font-medium text-foreground">
                                      {formatPrice(data.ma20)}
                                    </span>
                                  </div>
                                )}
                                {showMA && data.ma50 && (
                                  <div className="flex justify-between items-center gap-4">
                                    <span className="text-xs text-purple-500">MA50:</span>
                                    <span className="text-xs font-medium text-foreground">
                                      {formatPrice(data.ma50)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                />
                
                {/* Price Area */}
                <Area
                  yAxisId="price"
                  type="linear"
                  dataKey="price"
                  stroke={lineColor}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: lineColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
                
                {/* Moving Averages */}
                {showMA && (
                  <>
                    <Line
                      yAxisId="price"
                      type="linear"
                      dataKey="ma20"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                    <Line
                      yAxisId="price"
                      type="linear"
                      dataKey="ma50"
                      stroke="rgb(168, 85, 247)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No chart data available</p>
            </div>
          )}
        </div>

        {/* Volume Chart */}
        {enrichedData.length > 0 && enrichedData.some(d => d.volume && d.volume > 0) && (
          <div className="h-[120px] border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Volume</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  hide
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  orientation="right"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const volume = payload[0].value as number;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <span className="text-xs font-medium">
                            Vol: {volume ? (volume / 1000000).toFixed(2) : '0.00'}M
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="volume"
                  fill={lineColor}
                  opacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Price Statistics */}
        {enrichedData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      High <Info className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">{formatPrice(priceStats.max)}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The highest price the stock reached during this period</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <div className="text-center">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      Average <Info className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">{formatPrice(priceStats.avg)}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The average price of the stock during this period</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <div className="text-center">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      Low <Info className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">{formatPrice(priceStats.min)}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The lowest price the stock reached during this period</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </div>
        )}
      </Card>

      {/* Stock Details */}
      {stockInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Previous Close <Info className="w-3 h-3" />
                  </div>
                  <div className="text-xl font-semibold text-foreground">{formatPrice(stockInfo.previousClose)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">The stock's closing price from the previous trading day</p>
              </TooltipContent>
            </UITooltip>
          </Card>
          
          <Card className="p-4">
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Open <Info className="w-3 h-3" />
                  </div>
                  <div className="text-xl font-semibold text-foreground">{formatPrice(stockInfo.open)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">The price at which the stock started trading today</p>
              </TooltipContent>
            </UITooltip>
          </Card>
          
          <Card className="p-4">
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Day's Range <Info className="w-3 h-3" />
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {formatPrice(stockInfo.low)} - {formatPrice(stockInfo.high)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">The lowest and highest prices the stock reached today</p>
              </TooltipContent>
            </UITooltip>
          </Card>
          
          <Card className="p-4">
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    Volume <Info className="w-3 h-3" />
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {(stockInfo.volume / 1000000).toFixed(2)}M
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Total number of shares traded today. Higher volume means more activity.</p>
              </TooltipContent>
            </UITooltip>
          </Card>
          
          {stockInfo.high52Week && (
            <Card className="p-4">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      52 Week Range <Info className="w-3 h-3" />
                    </div>
                    <div className="text-xl font-semibold text-foreground">
                      {formatPrice(stockInfo.low52Week || 0)} - {formatPrice(stockInfo.high52Week)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The stock's lowest and highest prices over the past year</p>
                </TooltipContent>
              </UITooltip>
            </Card>
          )}
          
          {stockInfo.marketCap && (
            <Card className="p-4">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      Market Cap <Info className="w-3 h-3" />
                    </div>
                    <div className="text-xl font-semibold text-foreground">
                      ₹{(stockInfo.marketCap / 1e12).toFixed(2)}T
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Total value of all company shares. Shows how big the company is.</p>
                </TooltipContent>
              </UITooltip>
            </Card>
          )}
          
          {stockInfo.pe && (
            <Card className="p-4">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      P/E Ratio (TTM) <Info className="w-3 h-3" />
                    </div>
                    <div className="text-xl font-semibold text-foreground">{stockInfo.pe.toFixed(2)}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Price-to-Earnings ratio. Shows how much investors pay for each rupee of earnings. Lower can mean better value.</p>
                </TooltipContent>
              </UITooltip>
            </Card>
          )}
          
          {stockInfo.eps && (
            <Card className="p-4">
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      EPS (TTM) <Info className="w-3 h-3" />
                    </div>
                    <div className="text-xl font-semibold text-foreground">{formatPrice(stockInfo.eps)}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Earnings Per Share. The company's profit divided by total shares. Higher is better.</p>
                </TooltipContent>
              </UITooltip>
            </Card>
          )}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
};

export default StockChart;
