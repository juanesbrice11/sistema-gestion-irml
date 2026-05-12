// Client-only: jsPDF runs in the browser
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ResumenEstudianteData } from '@/actions/notas'
import type { Periodo } from '@/types/database'

interface PDFOptions {
  tipo: 'individual' | 'grupo'
  materia: string
  grupo: string
  periodos: Periodo[]
  datos: ResumenEstudianteData[]
}

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function generarPDF({ tipo, materia, grupo, periodos, datos }: PDFOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  const azul = [37, 67, 168] as [number, number, number]
  const verdeOscuro = [22, 101, 52] as [number, number, number]
  const rojo = [185, 28, 28] as [number, number, number]

  // ── Encabezado institucional ──────────────────────────────────────────────
  function drawHeader(subtitulo: string) {
    doc.setFillColor(...azul)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('IE Ramón Messa Londoño', margin, 11)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Sincé, Sucre · Sistema de Gestión Escolar EduGestión', margin, 17)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(subtitulo, margin, 24)
    doc.setTextColor(30, 30, 30)
  }

  // ── Info de materia/grupo ─────────────────────────────────────────────────
  function drawInfo(y: number) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Grupo: ${grupo}   ·   Materia: ${materia}   ·   Año: ${new Date().getFullYear()}`, margin, y)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pageW - margin, y, { align: 'right' })
    doc.setTextColor(30, 30, 30)
    return y + 6
  }

  // ── Tabla de actividades por periodo ─────────────────────────────────────
  function drawEstudiante(est: ResumenEstudianteData, startY: number): number {
    let y = startY

    // Nombre del estudiante
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...azul)
    doc.text(`${est.apellido}, ${est.nombre}`, margin, y)

    if (est.definitiva_anio !== null) {
      const label = `Definitiva año: ${est.definitiva_anio.toFixed(2)} — ${est.aprobo ? 'Aprobó' : 'Reprobó'}`
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(est.aprobo ? verdeOscuro : rojo))
      doc.text(label, pageW - margin, y, { align: 'right' })
    }
    doc.setTextColor(30, 30, 30)
    y += 6

    for (const rp of est.periodos) {
      const periodo = periodos.find((p) => p.id === rp.periodoId)
      const fechas = periodo ? `${formatFecha(periodo.fecha_inicio)} – ${formatFecha(periodo.fecha_fin)}` : ''

      // Sub-encabezado de periodo
      doc.setFillColor(240, 244, 255)
      doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...azul)
      doc.text(`Periodo ${rp.periodoNumero}  ·  Peso: ${rp.peso}%  ·  ${fechas}`, margin + 2, y)
      if (rp.definitiva !== null) {
        const txt = `Definitiva: ${rp.definitiva.toFixed(2)}`
        doc.setTextColor(...(rp.definitiva >= 3 ? verdeOscuro : rojo))
        doc.text(txt, pageW - margin - 2, y, { align: 'right' })
      }
      doc.setTextColor(30, 30, 30)
      y += 6

      if (rp.actividades.length === 0) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(150, 150, 150)
        doc.text('Sin actividades configuradas', margin + 4, y)
        doc.setTextColor(30, 30, 30)
        y += 5
        continue
      }

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Actividad', 'Porcentaje', 'Nota', 'Aporte']],
        body: rp.actividades.map((a) => {
          const aporte = a.valor !== null ? ((a.valor * a.porcentaje) / 100).toFixed(3) : '—'
          return [
            a.nombre,
            `${a.porcentaje}%`,
            a.valor !== null ? a.valor.toFixed(1) : '—',
            aporte,
          ]
        }),
        theme: 'grid',
        headStyles: { fillColor: azul, fontSize: 8, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 8, halign: 'center' },
        columnStyles: { 0: { halign: 'left' } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = parseFloat(data.cell.text[0])
            if (!isNaN(val) && val < 3) {
              data.cell.styles.textColor = [185, 28, 28]
              data.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })
      y = (doc as any).lastAutoTable.finalY + 4
    }
    return y + 6
  }

  // ── Tabla resumen grupo ───────────────────────────────────────────────────
  function drawResumenGrupo(startY: number) {
    const head = [
      ['Estudiante', ...periodos.map((p) => `P${p.numero}`), 'Definitiva', 'Estado'],
    ]
    const body = datos.map((d) => [
      `${d.apellido}, ${d.nombre}`,
      ...d.periodos.map((p) => (p.definitiva !== null ? p.definitiva.toFixed(2) : '—')),
      d.definitiva_anio !== null ? d.definitiva_anio.toFixed(2) : '—',
      d.definitiva_anio !== null ? (d.aprobo ? 'Aprobó' : 'Reprobó') : '—',
    ])

    autoTable(doc, {
      startY,
      margin: { left: margin, right: margin },
      head,
      body,
      theme: 'striped',
      headStyles: { fillColor: azul, fontSize: 8, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left' } },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const last = data.table.columns.length - 1
          const secondLast = last - 1
          if (data.column.index === last) {
            if (data.cell.text[0] === 'Reprobó') {
              data.cell.styles.textColor = [185, 28, 28]
              data.cell.styles.fontStyle = 'bold'
            } else if (data.cell.text[0] === 'Aprobó') {
              data.cell.styles.textColor = [22, 101, 52]
              data.cell.styles.fontStyle = 'bold'
            }
          }
          if (data.column.index === secondLast || (data.column.index > 0 && data.column.index < last)) {
            const val = parseFloat(data.cell.text[0])
            if (!isNaN(val) && val < 3) {
              data.cell.styles.textColor = [185, 28, 28]
              data.cell.styles.fontStyle = 'bold'
            }
          }
        }
      },
    })
  }

  // ── Generar PDF ───────────────────────────────────────────────────────────
  if (tipo === 'individual') {
    drawHeader('Informe de Notas — Individual')
    let y = drawInfo(33)

    for (let i = 0; i < datos.length; i++) {
      if (i > 0) {
        doc.addPage()
        drawHeader('Informe de Notas — Individual')
        y = drawInfo(33)
      }
      y = drawEstudiante(datos[i], y)
    }
  } else {
    // Resumen de grupo (tabla compacta en primera página)
    drawHeader('Informe de Notas — Grupo')
    let y = drawInfo(33)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen del grupo', margin, y)
    y += 5
    drawResumenGrupo(y)
    y = (doc as any).lastAutoTable.finalY + 8

    // Detalle individual de cada estudiante
    for (const est of datos) {
      if (y > 240) {
        doc.addPage()
        drawHeader('Informe de Notas — Grupo')
        y = drawInfo(33)
      }
      y = drawEstudiante(est, y)
    }
  }

  const filename = tipo === 'individual'
    ? `notas_${datos[0]?.apellido}_${materia}_${new Date().getFullYear()}.pdf`
    : `notas_grupo_${grupo}_${materia}_${new Date().getFullYear()}.pdf`

  doc.save(filename)
}
