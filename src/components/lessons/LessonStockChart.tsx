import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar, CartesianGrid, ReferenceLine } from "recharts";
import { Loader2, TrendingUp, TrendingDown, Activity, Calendar, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}
interface LessonStockChartProps {
  symbol: string;
  name: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  timeRange?: string; // Legacy: "1d", "5d", "1mo", etc.
  annotations?: Array<{
    y: number;
    label: string;
    date?: string;
  }>;
  showVolume?: boolean;
  showComparison?: boolean;
  tradeEntry?: number;
}

// Helper to convert timeRange to date range
const getDateRangeFromTimeRange = (timeRange: string): {
  startDate: string;
  endDate: string;
} => {
  const endDate = new Date();
  const startDate = new Date();
  switch (timeRange) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '5d':
      startDate.setDate(endDate.getDate() - 5);
      break;
    case '1mo':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3mo':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6mo':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case '5y':
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 1);
  }
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
};
const LessonStockChart = ({
  symbol,
  name,
  startDate: propStartDate,
  endDate: propEndDate,
  timeRange,
  annotations = [],
  showVolume = false,
  showComparison = false,
  tradeEntry
}: LessonStockChartProps) => {
  // Handle legacy timeRange or new startDate/endDate
  const dateRange = useMemo(() => {
    if (propStartDate && propEndDate) {
      return {
        startDate: propStartDate,
        endDate: propEndDate
      };
    } else if (timeRange) {
      return getDateRangeFromTimeRange(timeRange);
    } else {
      // Default to 1 month
      return getDateRangeFromTimeRange('1mo');
    }
  }, [propStartDate, propEndDate, timeRange]);
  const {
    startDate,
    endDate
  } = dateRange;
  const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
  const [currentData, setCurrentData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [viewMode, setViewMode] = useState<'lesson' | 'comparison'>('lesson');

  // Calculate moving averages
  const enrichedData = useMemo(() => {
    const data = viewMode === 'lesson' ? chartData : currentData;
    if (data.length === 0) return [];
    return data.map((point, index, array) => {
      let ma20 = null;
      if (index >= 19) {
        const sum = array.slice(index - 19, index + 1).reduce((acc, p) => acc + p.price, 0);
        ma20 = sum / 20;
      }
      let ma50 = null;
      if (index >= 49) {
        const sum = array.slice(index - 49, index + 1).reduce((acc, p) => acc + p.price, 0);
        ma50 = sum / 50;
      }
      return {
        ...point,
        ma20,
        ma50
      };
    });
  }, [chartData, currentData, viewMode]);

  // Calculate price statistics
  const priceStats = useMemo(() => {
    if (enrichedData.length === 0) return {
      min: 0,
      max: 0,
      avg: 0,
      change: 0,
      changePercent: 0
    };
    const prices = enrichedData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = change / firstPrice * 100;
    return {
      min,
      max,
      avg,
      change,
      changePercent
    };
  }, [enrichedData]);
  useEffect(() => {
    const loadHistoricalData = async () => {
    try {
      setLoading(true);

      // Fetch historical data for the lesson period
      const {
        data: lessonData,
        error: lessonError
      } = await supabase.functions.invoke('fetch-historical-data', {
        body: {
          symbol,
          period: 'custom',
          startDate,
          endDate
        }
      });
      if (lessonError) throw lessonError;
      if (lessonData.success && lessonData.data && lessonData.data.length > 0) {
        const points = lessonData.data.map((point: any) => ({
          timestamp: point.timestamp,
          price: point.close,
          volume: point.volume,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close
        }));
        setChartData(points);
      }

      // If comparison is enabled, fetch data from lesson end to now
      if (showComparison) {
        const {
          data: comparisonData,
          error: compError
        } = await supabase.functions.invoke('fetch-historical-data', {
          body: {
            symbol,
            period: 'custom',
            startDate: endDate,
            endDate: new Date().toISOString()
          }
        });
        if (!compError && comparisonData.success && comparisonData.data) {
          const compPoints = comparisonData.data.map((point: any) => ({
            timestamp: point.timestamp,
            price: point.close,
            volume: point.volume,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close
          }));
          setCurrentData(compPoints);
        }
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
    };

    loadHistoricalData();
  }, [symbol, startDate, endDate, showComparison]);
  const formatXAxis = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d');
  };
  const formatDetailedDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };
  const formatPrice = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };
  const isPositive = priceStats.change >= 0;
  const lineColor = isPositive ? "hsl(var(--chart-1))" : "hsl(var(--destructive))";
  if (loading) {
    return <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>;
  }
  return <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Chart Header */}
        

        {/* Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {viewMode === 'lesson' ? 'Historical Price Chart' : 'Future Performance'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {showMA && <>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-blue-500" />
                    <span className="text-muted-foreground">MA20</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-purple-500" />
                    <span className="text-muted-foreground">MA50</span>
                  </div>
                </>}
              <Button variant="ghost" size="sm" onClick={() => setShowMA(!showMA)} className="h-7 text-xs">
                {showMA ? 'Hide' : 'Show'} MA
              </Button>
            </div>
          </div>

          {/* Main Chart */}
          <div className="h-[450px] mb-4">
            {enrichedData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedData} margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0
            }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={lineColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={lineColor} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  
                  <XAxis dataKey="timestamp" tickFormatter={formatXAxis} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={{
                stroke: 'hsl(var(--border))'
              }} />
                  
                  <YAxis yAxisId="price" domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={value => `₹${value.toFixed(0)}`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={{
                stroke: 'hsl(var(--border))'
              }} width={70} orientation="right" />
                  
                  {/* Trade Entry Line */}
                  {tradeEntry && <ReferenceLine y={tradeEntry} yAxisId="price" stroke="hsl(var(--primary))" strokeDasharray="3 3" strokeWidth={2} label={{
                value: `Entry: ₹${tradeEntry}`,
                position: 'insideTopLeft',
                fontSize: 11,
                fill: 'hsl(var(--primary))',
                fontWeight: 'bold'
              }} />}

                  {/* Custom Annotations */}
                  {annotations.map((annotation, idx) => <ReferenceLine key={idx} y={annotation.y} yAxisId="price" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} label={{
                value: annotation.label,
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} />)}
                  
                  <Tooltip content={({
                active,
                payload
              }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
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
                                  {data.volume && <div className="flex justify-between items-center gap-4">
                                      <span className="text-xs text-muted-foreground">Volume:</span>
                                      <span className="text-xs font-medium text-foreground">
                                        {(data.volume / 1000000).toFixed(2)}M
                                      </span>
                                    </div>}
                                  {showMA && data.ma20 && <div className="flex justify-between items-center gap-4">
                                      <span className="text-xs text-blue-500">MA20:</span>
                                      <span className="text-xs font-medium text-foreground">
                                        {formatPrice(data.ma20)}
                                      </span>
                                    </div>}
                                  {showMA && data.ma50 && <div className="flex justify-between items-center gap-4">
                                      <span className="text-xs text-purple-500">MA50:</span>
                                      <span className="text-xs font-medium text-foreground">
                                        {formatPrice(data.ma50)}
                                      </span>
                                    </div>}
                                </div>
                              </div>
                            </div>
                          </div>;
                }
                return null;
              }} cursor={{
                stroke: 'hsl(var(--border))',
                strokeWidth: 1
              }} />
                  
                  <Area yAxisId="price" type="linear" dataKey="price" stroke={lineColor} fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2.5} dot={false} activeDot={{
                r: 6,
                fill: lineColor,
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }} />
                  
                  {showMA && <>
                      <Line yAxisId="price" type="linear" dataKey="ma20" stroke="rgb(59, 130, 246)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                      <Line yAxisId="price" type="linear" dataKey="ma50" stroke="rgb(168, 85, 247)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    </>}
                </ComposedChart>
              </ResponsiveContainer> : <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No chart data available</p>
              </div>}
          </div>

          {/* Volume Chart */}
          {showVolume && enrichedData.length > 0 && enrichedData.some(d => d.volume) && <div className="h-[120px] border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Volume</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedData} margin={{
              top: 0,
              right: 10,
              left: 0,
              bottom: 0
            }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatXAxis} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={{
                stroke: 'hsl(var(--border))'
              }} hide />
                  <YAxis tickFormatter={value => `${(value / 1000000).toFixed(0)}M`} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={70} orientation="right" />
                  <Tooltip content={({
                active,
                payload
              }) => {
                if (active && payload && payload.length) {
                  return <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <span className="text-xs font-medium">
                              Vol: {((payload[0].value as number) / 1000000).toFixed(2)}M
                            </span>
                          </div>;
                }
                return null;
              }} />
                  <Bar dataKey="volume" fill={lineColor} opacity={0.6} radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>}
        </Card>

        {/* Trade Performance Summary */}
        {viewMode === 'comparison' && tradeEntry && currentData.length > 0 && <Card className="p-6 bg-gradient-mint border-primary/20">
            <h4 className="font-bold mb-4">Your Trade Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Entry Price</p>
                <p className="text-lg font-bold text-primary">{formatPrice(tradeEntry)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Price</p>
                <p className="text-lg font-bold text-foreground">
                  {formatPrice(currentData[currentData.length - 1].price)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profit/Loss</p>
                <p className={`text-lg font-bold ${currentData[currentData.length - 1].price >= tradeEntry ? 'text-chart-1' : 'text-destructive'}`}>
                  {formatPrice(currentData[currentData.length - 1].price - tradeEntry)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Return</p>
                <p className={`text-lg font-bold ${currentData[currentData.length - 1].price >= tradeEntry ? 'text-chart-1' : 'text-destructive'}`}>
                  {((currentData[currentData.length - 1].price - tradeEntry) / tradeEntry * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>}
      </div>
    </TooltipProvider>;
};
export default LessonStockChart;