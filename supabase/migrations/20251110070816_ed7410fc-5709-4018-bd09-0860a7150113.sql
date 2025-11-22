-- Add scenario and quiz data to lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS scenario_data JSONB,
ADD COLUMN IF NOT EXISTS quiz_questions JSONB,
ADD COLUMN IF NOT EXISTS practice_stocks TEXT[];

-- Insert comprehensive interactive lessons
INSERT INTO lessons (title, description, content, category, difficulty, xp_reward, order_index, scenario_data, quiz_questions, practice_stocks)
VALUES 
(
  'Understanding Market Trends',
  'Learn to identify bullish and bearish trends through real market scenarios',
  '<h2>What are Market Trends?</h2><p>Market trends show the general direction of stock prices over time. Understanding these patterns is crucial for making informed investment decisions.</p><h3>Bullish Trend (Uptrend)</h3><p>A bullish trend occurs when prices consistently make higher highs and higher lows. This indicates strong buying pressure and investor confidence.</p><ul><li>Higher highs: Each peak is higher than the previous</li><li>Higher lows: Each trough is higher than the previous</li><li>Increasing volume on upward moves</li></ul><h3>Bearish Trend (Downtrend)</h3><p>A bearish trend shows lower highs and lower lows, indicating selling pressure and declining confidence.</p><ul><li>Lower highs: Each peak is lower than the previous</li><li>Lower lows: Each trough is lower than the previous</li><li>Increasing volume on downward moves</li></ul><h3>Sideways Trend</h3><p>When prices move within a range without clear direction, the market is consolidating.</p>',
  'technical_analysis',
  'beginner',
  100,
  1,
  '{"scenarios": [{"title": "Spotting a Bull Run", "description": "The chart shows RELIANCE stock over 3 months. Notice how prices consistently make higher highs.", "symbol": "RELIANCE.NS", "timeRange": "3mo", "questions": [{"question": "Is this a bullish or bearish trend?", "answer": "bullish"}, {"question": "Should you consider buying in this scenario?", "answer": "yes"}]}, {"title": "Identifying Downtrend", "description": "TCS stock shows clear lower lows over the past month.", "symbol": "TCS.NS", "timeRange": "1mo", "questions": [{"question": "What type of trend is this?", "answer": "bearish"}, {"question": "Is this a good time to enter?", "answer": "no"}]}]}',
  '[{"question": "What indicates a bullish trend?", "options": ["Higher highs and higher lows", "Lower highs and lower lows", "Sideways movement", "Random price action"], "correct": 0}, {"question": "In a bearish trend, you should:", "options": ["Buy immediately", "Wait for reversal signals", "Panic sell everything", "Ignore the market"], "correct": 1}, {"question": "Volume increasing during upward moves suggests:", "options": ["Weak trend", "Strong buying pressure", "Market manipulation", "Nothing significant"], "correct": 1}]',
  ARRAY['RELIANCE.NS', 'TCS.NS', 'INFY.NS']
),
(
  'Support and Resistance Levels',
  'Master the art of identifying key price levels where stocks tend to bounce or break',
  '<h2>Support and Resistance: Your Trading Foundation</h2><p>Support and resistance levels are like invisible walls that prices struggle to break through.</p><h3>Support Levels</h3><p>Support is a price level where buying interest is strong enough to overcome selling pressure. Think of it as a floor that prevents prices from falling further.</p><ul><li>Previous lows often act as support</li><li>Psychological price points (₹100, ₹500, ₹1000)</li><li>Moving averages can provide dynamic support</li></ul><h3>Resistance Levels</h3><p>Resistance is where selling pressure overcomes buying interest, acting as a ceiling.</p><ul><li>Previous highs create resistance</li><li>Round numbers act as psychological barriers</li><li>Multiple tests strengthen the level</li></ul><h3>Breakout Strategy</h3><p>When price breaks through resistance with high volume, it often becomes new support. This is a powerful buying signal.</p>',
  'technical_analysis',
  'intermediate',
  150,
  2,
  '{"scenarios": [{"title": "Support Holding Strong", "description": "INFY bounces off ₹1,450 three times - a strong support level.", "symbol": "INFY.NS", "timeRange": "3mo", "annotations": [{"y": 1450, "label": "Strong Support"}], "questions": [{"question": "How many times did price test support?", "answer": "3"}, {"question": "Is this a good buying opportunity?", "answer": "yes"}]}, {"title": "Resistance Breakout", "description": "HDFC breaks above ₹1,600 resistance with high volume.", "symbol": "HDFCBANK.NS", "timeRange": "6mo", "annotations": [{"y": 1600, "label": "Resistance Turned Support"}], "questions": [{"question": "What happens after breakout?", "answer": "continuation"}, {"question": "Should you buy on breakout?", "answer": "yes"}]}]}',
  '[{"question": "What is support?", "options": ["A price ceiling", "A price floor where buying increases", "Random price level", "A selling point"], "correct": 1}, {"question": "When resistance is broken with high volume:", "options": ["Sell immediately", "Wait and watch", "Consider it a buy signal", "Ignore it"], "correct": 2}, {"question": "Multiple tests of a level:", "options": ["Weaken it", "Strengthen it", "Have no effect", "Mean nothing"], "correct": 1}]',
  ARRAY['INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS']
),
(
  'Moving Averages for Trend Following',
  'Learn how to use Simple and Exponential Moving Averages to time your entries and exits',
  '<h2>Moving Averages: Smoothing Out Price Action</h2><p>Moving averages help filter out noise and identify the underlying trend direction.</p><h3>Simple Moving Average (SMA)</h3><p>The average closing price over a specific period. Common periods: 20-day, 50-day, 200-day.</p><ul><li>20-day: Short-term trend</li><li>50-day: Intermediate trend</li><li>200-day: Long-term trend</li></ul><h3>Golden Cross</h3><p>When the 50-day MA crosses above the 200-day MA, it signals a bullish trend. This is a powerful buy signal.</p><h3>Death Cross</h3><p>When the 50-day MA crosses below the 200-day MA, it signals a bearish trend. Time to be cautious.</p><h3>Trading Strategy</h3><ul><li>Buy when price crosses above moving average</li><li>Sell when price crosses below</li><li>Use multiple timeframes for confirmation</li></ul>',
  'technical_analysis',
  'intermediate',
  150,
  3,
  '{"scenarios": [{"title": "Golden Cross Signal", "description": "SBIN 50-day MA crosses above 200-day MA - bullish signal.", "symbol": "SBIN.NS", "timeRange": "1y", "indicators": ["50MA", "200MA"], "questions": [{"question": "Is this bullish or bearish?", "answer": "bullish"}, {"question": "Should you take a long position?", "answer": "yes"}]}, {"title": "Price Above Moving Average", "description": "TATAMOTORS trades above all major moving averages.", "symbol": "TATAMOTORS.NS", "timeRange": "6mo", "indicators": ["20MA", "50MA"], "questions": [{"question": "What does this indicate?", "answer": "uptrend"}, {"question": "Is trend strong?", "answer": "yes"}]}]}',
  '[{"question": "A Golden Cross occurs when:", "options": ["50MA crosses above 200MA", "50MA crosses below 200MA", "Price crosses MA", "Two prices meet"], "correct": 0}, {"question": "When price is above the 200-day MA:", "options": ["Bearish signal", "Bullish signal", "Neutral signal", "Sell signal"], "correct": 1}, {"question": "Death Cross indicates:", "options": ["Strong uptrend", "Market crash", "Potential bearish trend", "Buy opportunity"], "correct": 2}]',
  ARRAY['SBIN.NS', 'TATAMOTORS.NS', 'WIPRO.NS']
),
(
  'Volume Analysis: Reading Market Conviction',
  'Understand how trading volume confirms trends and signals potential reversals',
  '<h2>Volume: The Fuel Behind Price Moves</h2><p>Volume shows how many shares were traded. High volume confirms the strength of a price move.</p><h3>Volume Principles</h3><ul><li><strong>Rising prices + Rising volume = Strong uptrend</strong></li><li><strong>Rising prices + Falling volume = Weak uptrend (caution)</strong></li><li><strong>Falling prices + Rising volume = Strong downtrend</strong></li><li><strong>Falling prices + Falling volume = Weak downtrend</strong></li></ul><h3>Volume Spikes</h3><p>Sudden volume increases often signal important events:</p><ul><li>News announcements</li><li>Earnings reports</li><li>Institutional buying/selling</li><li>Trend reversals</li></ul><h3>Volume Confirmation</h3><p>Never trade breakouts without volume confirmation. A breakout on low volume often fails.</p>',
  'technical_analysis',
  'advanced',
  200,
  4,
  '{"scenarios": [{"title": "Volume Confirms Breakout", "description": "BHARTIARTL breaks resistance with 3x normal volume.", "symbol": "BHARTIARTL.NS", "timeRange": "3mo", "showVolume": true, "questions": [{"question": "Is this breakout reliable?", "answer": "yes"}, {"question": "Should you enter position?", "answer": "yes"}]}, {"title": "Weak Volume Rally", "description": "LT price rises but volume decreases - warning sign.", "symbol": "LT.NS", "timeRange": "1mo", "showVolume": true, "questions": [{"question": "Is this trend sustainable?", "answer": "no"}, {"question": "What should you do?", "answer": "wait"}]}]}',
  '[{"question": "High volume during price increase indicates:", "options": ["Weak trend", "Strong buying conviction", "Market manipulation", "Time to sell"], "correct": 1}, {"question": "A breakout without volume confirmation:", "options": ["Is very reliable", "Should be traded immediately", "Often fails", "Means nothing"], "correct": 2}, {"question": "Volume spike on down day suggests:", "options": ["Panic selling", "Strong buying", "Normal trading", "Market manipulation"], "correct": 0}]',
  ARRAY['BHARTIARTL.NS', 'LT.NS', 'MARUTI.NS']
),
(
  'Risk Management: Protecting Your Capital',
  'Master position sizing, stop losses, and portfolio allocation to survive and thrive',
  '<h2>The #1 Rule: Protect Your Capital</h2><p>Risk management separates successful traders from those who blow up their accounts.</p><h3>The 2% Rule</h3><p>Never risk more than 2% of your capital on a single trade. If you have ₹1,00,000, maximum risk per trade is ₹2,000.</p><h3>Position Sizing Formula</h3><p><strong>Position Size = (Account Size × Risk %) / (Entry Price - Stop Loss)</strong></p><p>Example: ₹1,00,000 account, 2% risk (₹2,000), stock at ₹100, stop loss at ₹95</p><p>Position Size = ₹2,000 / ₹5 = 400 shares</p><h3>Stop Loss Placement</h3><ul><li>Below recent support for long positions</li><li>Above recent resistance for short positions</li><li>Use ATR (Average True Range) for volatility-adjusted stops</li></ul><h3>Portfolio Allocation</h3><ul><li>No single stock should exceed 10-15% of portfolio</li><li>Diversify across sectors</li><li>Keep 20-30% in cash for opportunities</li></ul>',
  'risk_management',
  'advanced',
  200,
  5,
  '{"scenarios": [{"title": "Setting Proper Stop Loss", "description": "ITC at ₹420, support at ₹410. Where to place stop?", "symbol": "ITC.NS", "timeRange": "1mo", "annotations": [{"y": 410, "label": "Support Level"}], "questions": [{"question": "Where should stop loss be?", "answer": "408"}, {"question": "Why below support?", "answer": "confirmation"}]}, {"title": "Position Sizing Example", "description": "Calculate position size for AXISBANK trade.", "symbol": "AXISBANK.NS", "timeRange": "3mo", "tradeSetup": {"entry": 1050, "stop": 1030, "accountSize": 100000, "riskPercent": 2}, "questions": [{"question": "What is risk per trade?", "answer": "2000"}, {"question": "How many shares to buy?", "answer": "100"}]}]}',
  '[{"question": "The 2% rule means:", "options": ["Invest 2% of capital", "Risk maximum 2% per trade", "Keep 2% in cash", "Buy 2 stocks"], "correct": 1}, {"question": "Stop loss should be placed:", "options": ["Randomly", "Very close to entry", "Below support (long position)", "At round numbers"], "correct": 2}, {"question": "A well-diversified portfolio has:", "options": ["All stocks in one sector", "Maximum 2-3 stocks", "Stocks across different sectors", "Only large-cap stocks"], "correct": 2}]',
  ARRAY['ITC.NS', 'AXISBANK.NS', 'HINDALCO.NS']
),
(
  'Chart Patterns: Reading Market Psychology',
  'Identify powerful continuation and reversal patterns that predict future price movements',
  '<h2>Chart Patterns: Visual Price Language</h2><p>Chart patterns reveal the psychology of market participants and forecast future moves.</p><h3>Bullish Patterns</h3><p><strong>1. Cup and Handle:</strong> A U-shaped consolidation followed by a small pullback. Indicates continuation.</p><p><strong>2. Ascending Triangle:</strong> Higher lows meeting horizontal resistance. Bullish breakout pattern.</p><p><strong>3. Double Bottom:</strong> Two lows at same level forming a "W". Strong reversal signal.</p><h3>Bearish Patterns</h3><p><strong>1. Head and Shoulders:</strong> Three peaks with middle one highest. Powerful reversal pattern.</p><p><strong>2. Descending Triangle:</strong> Lower highs meeting horizontal support. Bearish breakdown pattern.</p><p><strong>3. Double Top:</strong> Two peaks at same level forming an "M". Reversal to downtrend.</p><h3>Trading Patterns</h3><ul><li>Wait for pattern completion before entry</li><li>Measure pattern height for price targets</li><li>Volume should confirm the breakout</li><li>Set stop loss below pattern support</li></ul>',
  'technical_analysis',
  'advanced',
  250,
  6,
  '{"scenarios": [{"title": "Cup and Handle Formation", "description": "TITAN forms perfect cup and handle pattern over 6 months.", "symbol": "TITAN.NS", "timeRange": "6mo", "patternType": "cup_and_handle", "questions": [{"question": "Is this bullish or bearish?", "answer": "bullish"}, {"question": "Where to enter?", "answer": "breakout"}]}, {"title": "Head and Shoulders Top", "description": "SUNPHARMA shows classic head and shoulders reversal.", "symbol": "SUNPHARMA.NS", "timeRange": "6mo", "patternType": "head_shoulders", "questions": [{"question": "What does this predict?", "answer": "reversal"}, {"question": "Should you exit longs?", "answer": "yes"}]}]}',
  '[{"question": "Cup and Handle is a:", "options": ["Reversal pattern", "Continuation pattern", "Random formation", "Bearish pattern"], "correct": 1}, {"question": "Head and Shoulders indicates:", "options": ["Bullish continuation", "Bearish reversal", "Sideways movement", "Strong uptrend"], "correct": 1}, {"question": "Ascending Triangle suggests:", "options": ["Bearish breakdown", "Bullish breakout", "No clear direction", "Market crash"], "correct": 1}]',
  ARRAY['TITAN.NS', 'SUNPHARMA.NS', 'ASIANPAINT.NS']
)
ON CONFLICT (id) DO NOTHING;