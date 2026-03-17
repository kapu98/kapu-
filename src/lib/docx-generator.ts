import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  Packer,
} from 'docx'
import { saveAs } from 'file-saver'
import type { ContraRiderContent } from '../types'

const primaryColor = '1A5276'
const accentColor = 'E67E22'
const lightBlue = 'D6EAF8'

function headerParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: 'FFFFFF',
        font: 'Calibri',
      }),
    ],
    shading: { type: ShadingType.SOLID, color: primaryColor },
    spacing: { before: 0, after: 0 },
    indent: { left: 200 },
  })
}

function sectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        color: 'FFFFFF',
        font: 'Calibri',
      }),
    ],
    shading: { type: ShadingType.SOLID, color: '2E86C1' },
    spacing: { before: 300, after: 100 },
    indent: { left: 200 },
  })
}

function infoRow(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18, color: primaryColor }),
      new TextRun({ text: value, size: 18 }),
    ],
    spacing: { before: 60, after: 60 },
    indent: { left: 200 },
  })
}

export async function generateContraRiderDocx(
  content: ContraRiderContent,
  filename: string
): Promise<void> {
  const tableNoBorder = {
    top: { style: BorderStyle.NIL },
    bottom: { style: BorderStyle.NIL },
    left: { style: BorderStyle.NIL },
    right: { style: BorderStyle.NIL },
    insideH: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
    insideV: { style: BorderStyle.NIL },
  }

  const children: (Paragraph | Table)[] = []

  // Title block
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'CONTRA-RIDER TÉCNICO',
          bold: true,
          size: 40,
          color: 'FFFFFF',
          font: 'Calibri',
        }),
      ],
      shading: { type: ShadingType.SOLID, color: primaryColor },
      spacing: { before: 0, after: 0 },
      indent: { left: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: content.company,
          size: 22,
          color: accentColor,
          bold: true,
          font: 'Calibri',
        }),
      ],
      shading: { type: ShadingType.SOLID, color: '0D2B3E' },
      spacing: { before: 0, after: 300 },
      indent: { left: 200 },
    })
  )

  // Event info
  children.push(
    headerParagraph('INFORMACIÓN DEL EVENTO'),
    infoRow('Artista', content.artist),
    infoRow('Evento', content.event),
    infoRow('Recinto', content.venue),
    infoRow('Fecha', content.date),
    infoRow('Empresa proveedora', content.company),
    new Paragraph({ text: '', spacing: { before: 200, after: 200 } })
  )

  // Intro paragraph
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `En respuesta al rider técnico de ${content.artist}, ${content.company} confirma el siguiente equipamiento para el evento:`,
          size: 18,
          italics: true,
          color: '555555',
        }),
      ],
      spacing: { before: 200, after: 400 },
    })
  )

  // Sections
  for (const section of content.sections) {
    if (section.items.length === 0) continue

    children.push(sectionHeader(section.title))

    // Table for this section
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Ud.', bold: true, size: 18, color: 'FFFFFF' })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 600, type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, color: '2E86C1' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Equipo / Descripción', bold: true, size: 18, color: 'FFFFFF' })],
          })],
          width: { size: 5000, type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, color: '2E86C1' },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: 'Notas', bold: true, size: 18, color: 'FFFFFF' })],
          })],
          width: { size: 3000, type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, color: '2E86C1' },
        }),
      ],
    })

    const dataRows = section.items.map((item, idx) => {
      const isEven = idx % 2 === 0
      const bgColor = isEven ? 'F5F5F5' : 'FFFFFF'
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: item.qty.toString(), bold: true, size: 18, color: primaryColor })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: bgColor },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: item.description, bold: true, size: 18 })],
              }),
              ...(item.detail ? [new Paragraph({
                children: [new TextRun({ text: item.detail, size: 16, color: '777777', italics: true })],
              })] : []),
            ],
            shading: { type: ShadingType.SOLID, color: bgColor },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: item.notes || '', size: 16, italics: true, color: '555555' })],
            })],
            shading: { type: ShadingType.SOLID, color: bgColor },
          }),
        ],
      })
    })

    children.push(
      new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableNoBorder,
      }),
      new Paragraph({ text: '', spacing: { before: 200, after: 200 } })
    )
  }

  // General notes
  if (content.general_notes) {
    children.push(
      sectionHeader('NOTAS GENERALES'),
      new Paragraph({
        children: [new TextRun({ text: content.general_notes, size: 18 })],
        spacing: { before: 200, after: 200 },
        indent: { left: 200 },
      })
    )
  }

  // Footer note
  children.push(
    new Paragraph({ text: '', spacing: { before: 400 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: '* Este documento es el contra-rider oficial de ',
          size: 16,
          italics: true,
          color: '777777',
        }),
        new TextRun({
          text: content.company,
          size: 16,
          bold: true,
          color: primaryColor,
        }),
        new TextRun({
          text: '. Cualquier modificación debe ser acordada por escrito.',
          size: 16,
          italics: true,
          color: '777777',
        }),
      ],
      spacing: { before: 0, after: 0 },
    })
  )

  const doc = new Document({
    sections: [{
      children,
      properties: {},
    }],
  })

  const buffer = await Packer.toBlob(doc)
  saveAs(buffer, filename)
}

export function buildContraRiderContent(
  analysis: import('../types').RiderAnalysis,
  event: import('../types').Event,
  company: import('../types').Company
): ContraRiderContent {
  const sections: import('../types').ContraRiderSection[] = []

  // SONIDO
  const soundItems: import('../types').ContraRiderItem[] = []

  if (analysis.sound.pa.rca_proposal) {
    soundItems.push({
      qty: 1,
      description: 'Sistema PA Principal',
      detail: analysis.sound.pa.rca_proposal,
      notes: analysis.sound.pa.status === 'partial' ? 'Alternativa técnica equivalente' : undefined,
    })
  }
  if (analysis.sound.foh_console.rca_proposal) {
    soundItems.push({
      qty: 1,
      description: 'Mesa FOH',
      detail: analysis.sound.foh_console.rca_proposal,
      notes: analysis.sound.foh_console.notes || undefined,
    })
  }
  if (analysis.sound.mon_console.rca_proposal) {
    soundItems.push({
      qty: 1,
      description: 'Mesa Monitores',
      detail: analysis.sound.mon_console.rca_proposal,
      notes: analysis.sound.mon_console.notes || undefined,
    })
  }
  if (analysis.sound.iem_systems.rca_proposal) {
    soundItems.push({
      qty: analysis.sound.iem_systems.available_count || 1,
      description: 'Sistema IEM',
      detail: analysis.sound.iem_systems.rca_proposal,
    })
  }

  // Microphones
  for (const mic of analysis.sound.microphones) {
    if (mic.proposal) {
      soundItems.push({
        qty: 1,
        description: `Micro CH${mic.channel} — ${mic.instrument}`,
        detail: mic.proposal,
        notes: mic.status === 'partial' ? 'Alternativa equivalente' : undefined,
      })
    }
  }

  // Monitors
  const monitorGroups: Record<string, number> = {}
  for (const mon of analysis.sound.monitors) {
    const key = mon.proposal || mon.type
    monitorGroups[key] = (monitorGroups[key] || 0) + 1
  }
  for (const [model, qty] of Object.entries(monitorGroups)) {
    soundItems.push({
      qty,
      description: 'Monitor escenario',
      detail: model,
    })
  }

  if (soundItems.length > 0) {
    sections.push({ title: 'SONIDO', items: soundItems })
  }

  // ILUMINACIÓN
  const lightItems: import('../types').ContraRiderItem[] = []

  if (analysis.lighting.console.rca_proposal) {
    lightItems.push({
      qty: 1,
      description: 'Consola de iluminación',
      detail: analysis.lighting.console.rca_proposal,
    })
  }
  for (const fix of analysis.lighting.fixtures) {
    if (fix.rca_model && fix.qty_available > 0) {
      lightItems.push({
        qty: fix.qty_available,
        description: fix.type,
        detail: fix.rca_model,
        notes: fix.qty_available < fix.qty_requested ? `Rider pide ${fix.qty_requested}, aportamos ${fix.qty_available}` : undefined,
      })
    }
  }
  for (const fx of analysis.lighting.fx) {
    if (fx.proposal) {
      lightItems.push({ qty: 1, description: fx.type, detail: fx.proposal })
    }
  }

  if (lightItems.length > 0) {
    sections.push({ title: 'ILUMINACIÓN', items: lightItems })
  }

  // VIDEO
  const videoItems: import('../types').ContraRiderItem[] = []
  for (const screen of analysis.video.screens) {
    if (screen.status !== 'pending') {
      videoItems.push({
        qty: 1,
        description: `Pantalla ${screen.size}`,
        detail: screen.type,
        notes: screen.status === 'partial' ? 'Según disponibilidad' : undefined,
      })
    }
  }
  if (videoItems.length > 0) {
    sections.push({ title: 'VIDEO', items: videoItems })
  }

  const eventDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return {
    artist: analysis.artist || event.artist || '',
    event: event.name,
    venue: `${event.venue || ''}${event.city ? `, ${event.city}` : ''}`,
    date: eventDate,
    company: company.name,
    sections,
    general_notes: `El equipo de ${company.name} estará en el recinto con suficiente antelación para el montaje. Rogamos confirmación de este contra-rider por parte del equipo de producción del artista.`,
  }
}
