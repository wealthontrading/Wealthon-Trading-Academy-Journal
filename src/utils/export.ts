import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Trade } from '../types';
import { globalMarketType } from './calculations';

export function exportTradesToExcel(trades: Trade[], traderName: string = 'Trader'): void {
  if (!trades || trades.length === 0) {
    alert('No trades available to export.');
    return;
  }

  const exportData = trades.map((t, idx) => ({
    'S.No': idx + 1,
    Date: t.date,
    Time: t.time || '',
    Platform: t.platform || '',
    Segment: t.segment,
    Symbol: t.indexOrStock,
    Strike: t.strikePrice || '-',
    Side: t.buyOrSell,
    'Entry ($/₹)': t.entryPrice,
    'Exit ($/₹)': t.exitPrice,
    Qty: t.quantity,
    'Gross P&L ($/₹)': t.grossPnL,
    'Brokerage ($/₹)': t.brokerage || 0,
    'Taxes & Charges ($/₹)': (t.taxes || 0) + (t.otherCharges || 0),
    'Total Charges ($/₹)': (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0),
    'Net P&L ($/₹)': t.netPnL,
    Status: t.status,
    Strategy: t.strategy || '',
    Emotion: t.emotion || '',
    'Holding Time (Mins)': t.holdingTimeMinutes || '-',
    'Trade Rationale & Reasons': t.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades History');

  // Format filename
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${traderName.replace(/\s+/g, '_')}_Trading_Journal_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

export function exportTradesToPDF(trades: Trade[], traderName: string = 'Trader'): void {
  if (!trades || trades.length === 0) {
    alert('No trades available to export.');
    return;
  }

  // Portrait A4 for detailed mentor reading with complete trade rationale & reasons
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const currencySymbol = globalMarketType === 'Forex' ? '$' : '₹';
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 15;

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('WEALTHON TRADING ACADEMY - MENTOR REPORT', margin + 5, currentY + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Student: ${traderName} | Generated: ${new Date().toLocaleDateString('en-IN')} | Total Trades: ${trades.length}`, margin + 5, currentY + 16);

  currentY += 28;

  // Performance Summary Box
  const totalNetPnL = trades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
  const totalGrossPnL = trades.reduce((acc, t) => acc + (t.grossPnL || 0), 0);
  const totalCharges = trades.reduce((acc, t) => acc + (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0), 0);
  const wins = trades.filter((t) => t.status === 'Profit').length;
  const losses = trades.filter((t) => t.status === 'Loss').length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text(`Net Realized P&L: ${currencySymbol}${totalNetPnL.toLocaleString('en-IN')}`, margin + 5, currentY + 7);
  doc.text(`Win Rate: ${winRate.toFixed(1)}% (${wins}W / ${losses}L)`, margin + 70, currentY + 7);
  doc.text(`Total Charges: ${currencySymbol}${totalCharges.toLocaleString('en-IN')}`, margin + 130, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gross P&L: ${currencySymbol}${totalGrossPnL.toLocaleString('en-IN')} | Report Scope: Detailed Trade Rationale & Reasons Log`, margin + 5, currentY + 14);

  currentY += 26;

  // Section Header: Detailed Trade Logs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detailed Trade Logs & Rationale', margin, currentY);

  currentY += 6;

  // Render Each Trade with Full Data & All Reasons
  trades.forEach((t, idx) => {
    // Check space remaining on page (a trade block takes ~35-50mm depending on notes)
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 15;
    }

    const tradeNetPnL = t.netPnL || 0;
    const isProfit = tradeNetPnL > 0;
    const isLoss = tradeNetPnL < 0;

    // Trade Box Background & Border
    const boxStartY = currentY;
    
    // Draw Trade Title Line
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, contentWidth, 7, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    const titleStr = `#${idx + 1} | ${t.date} ${t.time || ''} | ${t.indexOrStock} ${t.strikePrice || ''} (${t.segment}) - ${t.buyOrSell.toUpperCase()}`;
    doc.text(titleStr, margin + 3, currentY + 4.8);

    // Status / PnL on right of title bar
    if (isProfit) doc.setTextColor(22, 163, 74); // green
    else if (isLoss) doc.setTextColor(220, 38, 38); // red
    else doc.setTextColor(71, 85, 105);

    const pnlStr = `Net P&L: ${currencySymbol}${tradeNetPnL.toLocaleString('en-IN')} (${t.status})`;
    doc.text(pnlStr, pageWidth - margin - 3 - doc.getTextWidth(pnlStr), currentY + 4.8);

    currentY += 10;

    // Execution Details Grid
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const line1 = `Entry: ${currencySymbol}${t.entryPrice}  |  Exit: ${currencySymbol}${t.exitPrice}  |  Qty: ${t.quantity}  |  Gross P&L: ${currencySymbol}${t.grossPnL}`;
    doc.text(line1, margin + 4, currentY);

    currentY += 5;

    const totalTradeCharges = (t.brokerage || 0) + (t.taxes || 0) + (t.otherCharges || 0);
    const line2 = `Charges: ${currencySymbol}${totalTradeCharges} (Brk: ${currencySymbol}${t.brokerage || 0}, Tax: ${currencySymbol}${(t.taxes || 0) + (t.otherCharges || 0)})  |  Holding Time: ${t.holdingTimeMinutes ? `${t.holdingTimeMinutes} mins` : 'N/A'}`;
    doc.text(line2, margin + 4, currentY);

    currentY += 5;

    const line3 = `Strategy/Setup: ${t.strategy || 'N/A'}  |  Emotion: ${t.emotion || 'N/A'}  |  Platform: ${t.platform || 'Default'}`;
    doc.setFont('helvetica', 'bold');
    doc.text(line3, margin + 4, currentY);

    currentY += 6;

    // Full Trade Rationale / All Reasons
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Trade Rationale & Entry/Exit Reasons:', margin + 4, currentY);

    currentY += 4.5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const reasonText = t.notes && t.notes.trim().length > 0 ? t.notes.trim() : 'No additional rationale or notes entered for this trade.';
    const wrappedReasons = doc.splitTextToSize(reasonText, contentWidth - 10);

    // Check if wrapped reasons fit in page
    if (currentY + wrappedReasons.length * 4 > pageHeight - 15) {
      doc.addPage();
      currentY = 15;
    }

    doc.text(wrappedReasons, margin + 6, currentY);
    currentY += wrappedReasons.length * 4 + 4;

    // Outer Box Outline
    const boxHeight = currentY - boxStartY;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.rect(margin, boxStartY, contentWidth, boxHeight);

    currentY += 6; // Gap between trades
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - WealthOn Trading Academy Journal Report`, margin, pageHeight - 8);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${traderName.replace(/\s+/g, '_')}_Mentor_Report_${dateStr}.pdf`);
}

export function printTradeHistory(): void {
  window.print();
}
