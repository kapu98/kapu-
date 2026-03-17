import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Budget, BudgetLine, Company, Event } from '../types'

export function generateBudgetPDF(
  budget: Budget,
  lines: BudgetLine[],
  event: Event,
  company: Company
): void {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageW = doc.internal.pageSize.getWidth()

  // Colors
  const primaryDark = [26, 82, 118] as [number, number, number]
  const primaryMid = [46, 134, 193] as [number, number, number]
  const accent = [230, 126, 34] as [number, number, number]
  const textDark = [26, 26, 26] as [number, number, number]
  const textMuted = [108, 117, 125] as [number, number, number]
  const bgLight = [214, 234, 248] as [number, number, number]

  // Header background
  doc.setFillColor(...primaryDark)
  doc.rect(0, 0, pageW, 45, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(company.name || 'RCA Pro Audiovisuales', 15, 18)

  // Company details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(214, 234, 248)
  if (company.address) doc.text(company.address, 15, 25)
  if (company.phone) doc.text(`Tel: ${company.phone}`, 15, 30)
  if (company.email) doc.text(company.email, 15, 35)

  // Budget title (right side)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('PRESUPUESTO', pageW - 15, 18, { align: 'right' })
  doc.setFontSize(14)
  doc.setTextColor(...accent)
  doc.text(budget.budget_number, pageW - 15, 28, { align: 'right' })

  // Budget status badge
  const statusLabel = {
    borrador: 'BORRADOR',
    enviado: 'ENVIADO',
    aceptado: 'ACEPTADO',
    rechazado: 'RECHAZADO',
  }[budget.status] || budget.status.toUpperCase()

  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(statusLabel, pageW - 15, 36, { align: 'right' })

  // Event info box
  let y = 55
  doc.setFillColor(...bgLight)
  doc.roundedRect(15, y - 5, pageW - 30, 35, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...textDark)
  doc.text(event.name, 20, y + 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...textMuted)

  const col1 = 20
  const col2 = 100
  y += 10

  if (event.artist) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryMid)
    doc.text(event.artist, col1, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textMuted)
  }
  if (event.venue) doc.text(`📍 ${event.venue}${event.city ? `, ${event.city}` : ''}`, col1, y + 6)
  if (event.event_date) {
    const d = new Date(event.event_date)
    doc.text(`📅 ${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, col2, y)
  }
  doc.text(`Días: ${budget.days} | Ratio: x${budget.ratio}`, col2, y + 6)

  // Lines by category
  y = 100

  const categoryOrder: Array<{ key: string; label: string; color: [number, number, number] }> = [
    { key: 'sonido', label: 'SONIDO', color: primaryDark },
    { key: 'iluminacion', label: 'ILUMINACIÓN', color: [142, 68, 173] },
    { key: 'video', label: 'VIDEO', color: [23, 162, 74] },
    { key: 'personal', label: 'PERSONAL TÉCNICO', color: [230, 126, 34] },
    { key: 'transporte', label: 'TRANSPORTE', color: [108, 117, 125] },
    { key: 'otro', label: 'OTROS', color: [108, 117, 125] },
  ]

  for (const cat of categoryOrder) {
    const catLines = lines.filter(l => l.category === cat.key)
    if (catLines.length === 0) continue

    // Category header
    doc.setFillColor(...cat.color)
    doc.rect(15, y, pageW - 30, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text(cat.label, 18, y + 5.5)

    const subtotal = catLines.reduce((s, l) => s + l.subtotal, 0)
    doc.text(`${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, pageW - 17, y + 5.5, { align: 'right' })
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Descripción', 'Ud.', 'Días', 'Ratio', 'Precio/día', 'Subtotal']],
      body: catLines.map(l => [
        l.description + (l.detail ? `\n${l.detail}` : ''),
        l.quantity.toString(),
        l.days.toString(),
        `x${l.ratio}`,
        `${l.unit_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
        `${l.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: textDark, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 15, right: 15 },
      theme: 'plain',
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // Totals box
  y += 5
  const totalsX = pageW - 80
  const totalsW = 65

  doc.setFillColor(245, 245, 245)
  doc.roundedRect(totalsX, y, totalsW, 45, 2, 2, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...textMuted)

  const lineH = 7
  doc.text('Base imponible:', totalsX + 5, y + lineH)
  doc.text(`${budget.base_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, totalsX + totalsW - 5, y + lineH, { align: 'right' })

  doc.text(`IVA (${budget.vat_rate}%):`, totalsX + 5, y + lineH * 2)
  doc.text(`${budget.vat_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, totalsX + totalsW - 5, y + lineH * 2, { align: 'right' })

  // Separator
  doc.setDrawColor(...primaryDark)
  doc.line(totalsX + 5, y + lineH * 2.5, totalsX + totalsW - 5, y + lineH * 2.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...primaryDark)
  doc.text('TOTAL:', totalsX + 5, y + lineH * 3.5)
  doc.setFontSize(13)
  doc.setTextColor(...accent)
  doc.text(`${budget.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, totalsX + totalsW - 5, y + lineH * 3.5, { align: 'right' })

  // Notes
  if (budget.notes) {
    y += 55
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...textDark)
    doc.text('Notas:', 15, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textMuted)
    const splitNotes = doc.splitTextToSize(budget.notes, pageW - 30)
    doc.text(splitNotes, 15, y + 5)
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...textMuted)
    doc.text(
      `${company.name} • ${company.address || ''} • ${company.phone || ''} • ${company.email || ''}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageW - 15,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    )
  }

  doc.save(`${budget.budget_number}_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
}
