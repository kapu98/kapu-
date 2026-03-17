// Extract text from PDF using pdfjs-dist
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  // Set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: unknown) => {
        const textItem = item as { str?: string }
        return textItem.str || ''
      })
      .join(' ')
    fullText += `\n--- Página ${i} ---\n${pageText}`
  }

  return fullText.trim()
}
