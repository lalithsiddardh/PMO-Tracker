import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const v = row[h];
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }));
  const csv = [headers.join(','), ...rows.join('\n')].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportExcel(data, filename) {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wc = {};
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_col(c);
    let maxLen = 10;
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[addr + (r + 1)];
      if (cell && cell.v) maxLen = Math.max(maxLen, String(cell.v).length);
    }
    wc[addr] = { wch: Math.min(maxLen + 3, 40) };
  }
  ws['!cols'] = Object.entries(wc).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31));
  XLSX.writeFile(wb, `${filename.replace(/\s+/g, '_')}.xlsx`);
}

export async function exportPDF(elementId, title, filename) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  pdf.setFontSize(16);
  pdf.text(title, pageW / 2, 15, { align: 'center' });
  pdf.setFontSize(9);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, 22, { align: 'center' });

  const tables = el.querySelectorAll('.report-table');
  if (tables.length > 0) {
    let yPos = 30;
    tables.forEach((table) => {
      if (yPos > 250) { pdf.addPage(); yPos = 20; }
      const caption = table.getAttribute('data-caption') || '';
      if (caption) {
        pdf.setFontSize(11);
        pdf.text(caption, 14, yPos);
        yPos += 7;
      }
      const headers = [];
      const body = [];
      const thead = table.querySelector('thead');
      if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
          headerRow.querySelectorAll('th').forEach(th => headers.push(th.textContent.trim()));
        }
      }
      const tbody = table.querySelector('tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
          const row = [];
          tr.querySelectorAll('td').forEach(td => row.push(td.textContent.trim()));
          if (row.length > 0) body.push(row);
        });
      }
      if (headers.length > 0 && body.length > 0) {
        pdf.autoTable({
          head: [headers],
          body,
          startY: yPos,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 7, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { left: 10, right: 10 },
        });
        yPos = pdf.lastAutoTable.finalY + 8;
      }
    });
  }

  const charts = el.querySelectorAll('.report-chart');
  if (charts.length > 0) {
    for (const chart of charts) {
      try {
        const canvas = await html2canvas(chart, {
          scale: 2, useCORS: true, backgroundColor: '#ffffff',
          logging: false, width: chart.scrollWidth, height: chart.scrollHeight,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW - 20;
        const imgH = (canvas.height / canvas.width) * imgW;
        if (pdf.lastAutoTable?.finalY > 200 || pdf.internal.getNumberOfPages() > 1) pdf.addPage();
        const y = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 10 : 30;
        pdf.addImage(imgData, 'PNG', 10, y, imgW, Math.min(imgH, 100));
        if (imgH > 100) {
          pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH);
        }
      } catch (e) {
        console.warn('Chart render skipped:', e);
      }
    }
  }

  pdf.save(`${filename.replace(/\s+/g, '_')}.pdf`);
}
