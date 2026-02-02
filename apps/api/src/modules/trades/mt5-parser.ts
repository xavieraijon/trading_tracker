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
      let closeAtIdx = 9;
      let closePriceIdx = 10;
      let commissionIdx = 11;
      let swapIdx = 12;
      let profitIdx = 13;

      // Check if price is at index 6 by parsing it. If index 5 looks like a price instead of volume, adjust.
      const val5 = parseNumber($(cells[5]).text());
      const val6 = parseNumber($(cells[6]).text());

      // Volume is usually small (0.01 - 100), Price is usually large.
      // But let's be smarter: check if we have 14 cells.
      if (cells.length === 14) {
        // Standard position report
      } else if (cells.length === 13) {
        // Shifted report (likely no hidden magic column)
        volumeIdx = 4;
        openPriceIdx = 5;
        closeAtIdx = 8;
        closePriceIdx = 9;
        commissionIdx = 10;
        swapIdx = 11;
        profitIdx = 12;
      }

      const volumeVal = parseNumber($(cells[volumeIdx]).text());
      const openPrice = parseNumber($(cells[openPriceIdx]).text());
      const closeAtStr = $(cells[closeAtIdx]).text().trim();
      const closePrice = parseNumber($(cells[closePriceIdx]).text());
      const commission = parseNumber($(cells[commissionIdx]).text());
      const swap = parseNumber($(cells[swapIdx]).text());
      const profit = parseNumber($(cells[profitIdx]).text());

      if (!openAtStr || !ticket || !symbol || isNaN(volumeVal) || volumeVal === 0) {
        console.log(`Row ${i} skipped: Invalid data. Ticket: ${ticket}, Symbol: ${symbol}, Volume: ${volumeVal}`);
        return;
      }

      console.log(`Successfully parsed trade ${ticket}: ${symbol} ${type} ${volumeVal} @ ${openPrice}`);

      trades.push({
        openAt: parseMT5Date(openAtStr),
        closeAt: parseMT5Date(closeAtStr),
        externalId: ticket,
        instrument: symbol,
        side: (type.includes('buy') || type.includes('long')) ? 'LONG' : 'SHORT',
        quantity: volumeVal,
        entryPrice: openPrice,
        exitPrice: closePrice,
        commission: commission,
        swap: swap,
        pnlGross: profit,
        pnlNet: profit + commission + swap
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
