import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportPDF(title, columns, rows, filename = 'reporte.pdf') {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es')}`, 14, 28);
  doc.autoTable({
    startY: 34,
    head: [columns],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  doc.save(filename);
}

export function exportExcel(title, columns, rows, filename = 'reporte.xlsx') {
  const wb = XLSX.utils.book_new();
  const data = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = columns.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, filename);
}
