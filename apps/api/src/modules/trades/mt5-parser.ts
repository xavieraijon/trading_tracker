import * as cheerio from 'cheerio';

export interface MT5ParsedTrade {
  openAt: Date;
  closeAt: Date;
  externalId: string;
  instrument: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  commission: number;
  swap: number;
  pnlGross: number;
  pnlNet: number;
  stopLoss?: number;
  riskAmount?: number;
}

export interface MT5ReportInfo {
  accountLogin?: string;
  accountName?: string;
  company?: string;
  currency?: string;
  balance?: number;
}

export function extractReportInfo(html: string): MT5ReportInfo {
  const $ = cheerio.load(html);
  const info: MT5ReportInfo = {};

  // Try to find the header table or div containing account info
  // Common MT5 format: Has a header with "Account: 123456 - Name" and "Company"

  const headerText = $('body').text(); // Naive but might capture top text

  // Strategy 1: Look for specific patterns in text nodes immediately in body or top divs
  // Example: "Account: 123456" or "Login: 123456"

  // MT5 reports often put info in a list or simple text at top
  // "Name (Account): 112233" or "112233 (Name)"
  // "Company: FTMO"

  // Let's iterate over ALL elements that might contain this info
  // Usually in <li> or <div> or just text nodes

  // Generic Regex approach on the whole text snippet of the header
  // Limit to first 2000 chars to avoid performance issues
  const textSnippet = headerText.substring(0, 3000);

  // 1. Account / Login (More robust)
  // Patterns: "Account: 123456", "Login: 123456", "Cuenta: 123456", "#123456", or just a large number near "Name/Nombre"
  const accountMatch =
    textSnippet.match(/(?:Account|Login|Cuenta|#):\s*(\d+)/i) ||
    textSnippet.match(/(\d{5,})\s*[\(]?/); // Look for 5+ digits at start of lines or in parentheses

  if (accountMatch) {
    info.accountLogin = accountMatch[1].trim();
  }

  // 2. Company / Broker
  // "Broker: XYZ", "Company: ABC", "Empresa: ABC", "Servidor: ABC"
  const companyMatch = textSnippet.match(/(?:Broker|Company|Empresa|Servidor):\s*([^\n\r]+)/i);
  if (companyMatch) {
    info.company = companyMatch[1].trim().split('-')[0].trim(); // Get main part if it has - ServerX
  } else {
      // Try to guess from Title
      const title = $('title').text();
      if (title && !title.includes('Report') && !title.includes('Statement')) {
          info.company = title.trim();
      }
  }

  // 3. Currency / Divisa
  // "Currency: USD", "Moneda: EUR", or in Deposit line "Deposit: 10000.00 USD"
  const currencyMatch =
    textSnippet.match(/(?:Currency|Moneda|Divisa):\s*([A-Z]{3})/i) ||
    textSnippet.match(/(?:Deposit|Depósito|Balance):?\s*[\d\s\.,]+\s*([A-Z]{3})/i) ||
    textSnippet.match(/\s([A-Z]{3})\s/); // Last resort: find any 3-letter uppercase code

  if (currencyMatch) {
    info.currency = currencyMatch[1];
  }

  // 4. Initial Balance
  // "Deposit: 10000.00", "Depósito: 10.000,00", "Balance: 10000"
  const balanceMatch = textSnippet.match(/(?:Deposit|Depósito|Balance|Inversión):\s*([\d\s\.,]+)/i);
  if (balanceMatch) {
    const rawBalance = balanceMatch[1].replace(/\s/g, '');
    // Try to parse number handling both . and , as decimals (MT5 uses user locale)
    // Most common: 10,000.00 or 10.000,00
    info.balance = parseInitialBalance(rawBalance);
  }

  return info;
}

function parseInitialBalance(str: string): number {
    // If it has both , and ., usually thousands separator and decimal
    if (str.includes(',') && str.includes('.')) {
        if (str.indexOf('.') < str.indexOf(',')) {
            // format 10.000,00
            return parseFloat(str.replace(/\./g, '').replace(',', '.'));
        } else {
            // format 10,000.00
            return parseFloat(str.replace(/,/g, ''));
        }
    }
    // If only has , it might be decimal or thousands
    if (str.includes(',')) {
        // If , is near the end (2-3 digits after), assume decimal
        const parts = str.split(',');
        if (parts[parts.length - 1].length <= 2) {
            return parseFloat(str.replace(',', '.'));
        }
        return parseFloat(str.replace(',', ''));
    }
    return parseFloat(str);
}

export function parseMT5Html(html: string): MT5ParsedTrade[] {
  const $ = cheerio.load(html);
  const trades: MT5ParsedTrade[] = [];

  const rows = $('tr');
  let inPositionsSection = false;

  console.log(`Analyzing MT5 HTML: ${rows.length} rows found.`);

  rows.each((i, row) => {
    // Get text including nested elements like <b>
    const text = $(row).text().trim().toLowerCase();

    // Switch section - support Spanish and English, and handle <b> tags inside <td>/<th>
    if (text === 'posiciones' || text === 'positions' ||
        text.includes('posiciones cerradas') || text.includes('closed positions')) {
      console.log(`Found positions section at row ${i}`);
      inPositionsSection = true;
      return;
    }

    if (inPositionsSection) {
      // Detect end of section - more robust
      if (text === 'órdenes' || text === 'orders' ||
          text === 'transacciones' || text === 'deals' ||
          text === 'resultados' || text === 'summary') {
        console.log(`End of positions section at row ${i} (Reason: ${text})`);
        inPositionsSection = false;
        return;
      }

      const cells = $(row).find('td');

      // MT5 rows are usually quite dense (10+ cells)
      if (cells.length < 10) {
        // console.log(`Skipping row ${i}: Not enough cells (${cells.length})`);
        return;
      }

      // Skip the actual header row if it's using <td> instead of <th>
      if (text.includes('fecha') || text.includes('time') || text.includes('símbolo') || text.includes('symbol')) {
        console.log(`Skipping header row at index ${i}`);
        return;
      }

      const openAtStr = $(cells[0]).text().trim();
      const ticket = $(cells[1]).text().trim();
      const symbol = $(cells[2]).text().trim();
      const type = $(cells[3]).text().trim().toLowerCase();

      // MetaTrader HTML can have various column counts.
      // Based on the user's file:
      // 0: Open Time, 1: Ticket, 2: Symbol, 3: Type, 4: Hidden (Magic?), 5: Volume, 6: Open Price, 7: S/L, 8: T/P, 9: Close Time, 10: Close Price, 11: Commission, 12: Swap, 13: Profit

      let volumeIdx = 5;
      let openPriceIdx = 6;
      let slIdx = 7;
      let closeAtIdx = 9;
      let closePriceIdx = 10;
      let commissionIdx = 11;
      let swapIdx = 12;
      let profitIdx = 13;

      if (cells.length === 13) {
        // Shifted report (likely no hidden magic column)
        volumeIdx = 4;
        openPriceIdx = 5;
        slIdx = 6;
        closeAtIdx = 8;
        closePriceIdx = 9;
        commissionIdx = 10;
        swapIdx = 11;
        profitIdx = 12;
      }

      const volumeVal = parseNumber($(cells[volumeIdx]).text());
      const openPrice = parseNumber($(cells[openPriceIdx]).text());
      const stopLoss = parseNumber($(cells[slIdx]).text());
      const closeAtStr = $(cells[closeAtIdx]).text().trim();
      const closePrice = parseNumber($(cells[closePriceIdx]).text());
      const commission = parseNumber($(cells[commissionIdx]).text());
      const swap = parseNumber($(cells[swapIdx]).text());
      const profit = parseNumber($(cells[profitIdx]).text());

      if (!openAtStr || !ticket || !symbol || isNaN(volumeVal) || volumeVal === 0) {
        console.log(`Row ${i} skipped: Invalid data. Ticket: ${ticket}, Symbol: ${symbol}, Volume: ${volumeVal}`);
        return;
      }

      const side = (type.includes('buy') || type.includes('long')) ? 'LONG' : 'SHORT';

      // Calculate Risk Amount if S/L is present
      let riskAmount = undefined;
      if (stopLoss && stopLoss > 0) {
          riskAmount = Math.abs(openPrice - stopLoss) * volumeVal;
      }

      trades.push({
        openAt: parseMT5Date(openAtStr),
        closeAt: parseMT5Date(closeAtStr),
        externalId: ticket,
        instrument: symbol,
        side,
        quantity: volumeVal,
        entryPrice: openPrice,
        exitPrice: closePrice,
        commission: commission,
        swap: swap,
        pnlGross: profit,
        pnlNet: profit + commission + swap,
        stopLoss: stopLoss > 0 ? stopLoss : undefined,
        riskAmount
      });
    }
  });

  return trades;
}

function parseNumber(val: string): number {
  if (!val) return 0;
  // MetaTrader uses non-breaking spaces sometimes and spaces as thousand separators.
  // Example: "1 234.56" or "1 234.56"
  const cleaned = val.replace(/&nbsp;/g, '').replace(/\s/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseMT5Date(str: string): Date {
  if (!str || str === '') return null;
  // format: 2025.10.29 09:58:52 -> 2025-10-29T09:58:52
  const normalized = str.replace(/\./g, '-').replace(' ', 'T');
  return new Date(normalized);
}
