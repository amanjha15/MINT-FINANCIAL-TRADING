-- Add comprehensive list of popular stocks for monitoring
INSERT INTO monitored_stocks (symbol, name, exchange, is_active) VALUES
-- Major US Tech Stocks
('ORCL', 'Oracle Corporation', 'NYSE', true),
('ADBE', 'Adobe Inc.', 'NASDAQ', true),
('CRM', 'Salesforce Inc.', 'NYSE', true),
('NFLX', 'Netflix Inc.', 'NASDAQ', true),
('INTC', 'Intel Corporation', 'NASDAQ', true),
('AMD', 'Advanced Micro Devices', 'NASDAQ', true),
('CSCO', 'Cisco Systems', 'NASDAQ', true),
('AVGO', 'Broadcom Inc.', 'NASDAQ', true),
('QCOM', 'Qualcomm Inc.', 'NASDAQ', true),
('TXN', 'Texas Instruments', 'NASDAQ', true),
('PYPL', 'PayPal Holdings', 'NASDAQ', true),
('SQ', 'Block Inc.', 'NYSE', true),
('SHOP', 'Shopify Inc.', 'NYSE', true),
('UBER', 'Uber Technologies', 'NYSE', true),
('LYFT', 'Lyft Inc.', 'NASDAQ', true),
('ABNB', 'Airbnb Inc.', 'NASDAQ', true),
('SNOW', 'Snowflake Inc.', 'NYSE', true),
('PLTR', 'Palantir Technologies', 'NYSE', true),
('COIN', 'Coinbase Global', 'NASDAQ', true),
('RBLX', 'Roblox Corporation', 'NYSE', true),

-- Major US Financial
('BAC', 'Bank of America', 'NYSE', true),
('WFC', 'Wells Fargo', 'NYSE', true),
('C', 'Citigroup Inc.', 'NYSE', true),
('GS', 'Goldman Sachs', 'NYSE', true),
('MS', 'Morgan Stanley', 'NYSE', true),
('AXP', 'American Express', 'NYSE', true),
('MA', 'Mastercard Inc.', 'NYSE', true),
('BLK', 'BlackRock Inc.', 'NYSE', true),

-- Major US Consumer
('KO', 'Coca-Cola Company', 'NYSE', true),
('PEP', 'PepsiCo Inc.', 'NASDAQ', true),
('MCD', 'McDonald''s Corporation', 'NYSE', true),
('SBUX', 'Starbucks Corporation', 'NASDAQ', true),
('NKE', 'Nike Inc.', 'NYSE', true),
('DIS', 'Walt Disney Company', 'NYSE', true),
('HD', 'Home Depot', 'NYSE', true),
('LOW', 'Lowe''s Companies', 'NYSE', true),
('TGT', 'Target Corporation', 'NYSE', true),
('COST', 'Costco Wholesale', 'NASDAQ', true),

-- Major US Healthcare & Pharma
('JNJ', 'Johnson & Johnson', 'NYSE', true),
('PFE', 'Pfizer Inc.', 'NYSE', true),
('UNH', 'UnitedHealth Group', 'NYSE', true),
('ABBV', 'AbbVie Inc.', 'NYSE', true),
('TMO', 'Thermo Fisher Scientific', 'NYSE', true),
('ABT', 'Abbott Laboratories', 'NYSE', true),
('BMY', 'Bristol-Myers Squibb', 'NYSE', true),
('LLY', 'Eli Lilly and Company', 'NYSE', true),
('AMGN', 'Amgen Inc.', 'NASDAQ', true),
('GILD', 'Gilead Sciences', 'NASDAQ', true),

-- Major US Energy & Industrial
('XOM', 'Exxon Mobil', 'NYSE', true),
('CVX', 'Chevron Corporation', 'NYSE', true),
('BA', 'Boeing Company', 'NYSE', true),
('CAT', 'Caterpillar Inc.', 'NYSE', true),
('GE', 'General Electric', 'NYSE', true),
('MMM', '3M Company', 'NYSE', true),
('HON', 'Honeywell International', 'NASDAQ', true),
('UPS', 'United Parcel Service', 'NYSE', true),
('FDX', 'FedEx Corporation', 'NYSE', true),

-- Indian Banking & Finance
('SBIN.NS', 'State Bank of India', 'NSE', true),
('KOTAKBANK.NS', 'Kotak Mahindra Bank', 'NSE', true),
('AXISBANK.NS', 'Axis Bank', 'NSE', true),
('BAJFINANCE.NS', 'Bajaj Finance', 'NSE', true),
('BAJAJFINSV.NS', 'Bajaj Finserv', 'NSE', true),
('HDFCLIFE.NS', 'HDFC Life Insurance', 'NSE', true),
('SBILIFE.NS', 'SBI Life Insurance', 'NSE', true),

-- Indian IT & Tech
('WIPRO.NS', 'Wipro', 'NSE', true),
('TECHM.NS', 'Tech Mahindra', 'NSE', true),
('HCLTECH.NS', 'HCL Technologies', 'NSE', true),

-- Indian Consumer & Pharma
('ITC.NS', 'ITC Limited', 'NSE', true),
('HINDUNILVR.NS', 'Hindustan Unilever', 'NSE', true),
('ASIANPAINT.NS', 'Asian Paints', 'NSE', true),
('MARUTI.NS', 'Maruti Suzuki', 'NSE', true),
('TATAMOTORS.NS', 'Tata Motors', 'NSE', true),
('SUNPHARMA.NS', 'Sun Pharmaceutical', 'NSE', true),
('DRREDDY.NS', 'Dr. Reddy''s Laboratories', 'NSE', true),
('CIPLA.NS', 'Cipla', 'NSE', true),
('DIVISLAB.NS', 'Divi''s Laboratories', 'NSE', true),

-- Indian Energy & Infrastructure
('ONGC.NS', 'Oil and Natural Gas Corp', 'NSE', true),
('BPCL.NS', 'Bharat Petroleum', 'NSE', true),
('IOC.NS', 'Indian Oil Corporation', 'NSE', true),
('POWERGRID.NS', 'Power Grid Corporation', 'NSE', true),
('NTPC.NS', 'NTPC Limited', 'NSE', true),
('LT.NS', 'Larsen & Toubro', 'NSE', true),
('ULTRACEMCO.NS', 'UltraTech Cement', 'NSE', true),

-- Indian Telecom & Media
('BHARTIARTL.NS', 'Bharti Airtel', 'NSE', true),
('ADANIENT.NS', 'Adani Enterprises', 'NSE', true),
('ADANIPORTS.NS', 'Adani Ports', 'NSE', true),
('TITAN.NS', 'Titan Company', 'NSE', true),

-- More popular US stocks
('SPOT', 'Spotify Technology', 'NYSE', true),
('ZM', 'Zoom Video Communications', 'NASDAQ', true),
('DOCU', 'DocuSign Inc.', 'NASDAQ', true),
('TWLO', 'Twilio Inc.', 'NYSE', true),
('NET', 'Cloudflare Inc.', 'NYSE', true),
('DDOG', 'Datadog Inc.', 'NASDAQ', true),
('CRWD', 'CrowdStrike Holdings', 'NASDAQ', true),
('OKTA', 'Okta Inc.', 'NASDAQ', true),
('TEAM', 'Atlassian Corporation', 'NASDAQ', true),
('NOW', 'ServiceNow Inc.', 'NYSE', true),
('WDAY', 'Workday Inc.', 'NASDAQ', true),
('PANW', 'Palo Alto Networks', 'NASDAQ', true),
('FTNT', 'Fortinet Inc.', 'NASDAQ', true),
('MU', 'Micron Technology', 'NASDAQ', true),
('AMAT', 'Applied Materials', 'NASDAQ', true),
('LRCX', 'Lam Research', 'NASDAQ', true),
('KLAC', 'KLA Corporation', 'NASDAQ', true),
('MRVL', 'Marvell Technology', 'NASDAQ', true),
('ON', 'ON Semiconductor', 'NASDAQ', true),
('MPWR', 'Monolithic Power Systems', 'NASDAQ', true),

-- Additional ETFs and popular tickers
('SPY', 'SPDR S&P 500 ETF', 'NYSE', true),
('QQQ', 'Invesco QQQ Trust', 'NASDAQ', true),
('DIA', 'SPDR Dow Jones Industrial', 'NYSE', true),
('IWM', 'iShares Russell 2000 ETF', 'NYSE', true),
('VTI', 'Vanguard Total Stock Market', 'NYSE', true)

ON CONFLICT (symbol) DO NOTHING;