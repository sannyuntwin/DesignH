import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const getExportOptions = () => ({
  backgroundColor: null, // Respect design background
  scale: 4, // Higher quality for print (300 DPI approx)
  logging: false,
  useCORS: true,
  allowTaint: true,
  onclone: (clonedDoc: Document) => {
    // Hide all elements with the 'no-export' class
    const noExportElements = clonedDoc.querySelectorAll('.no-export')
    noExportElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none'
      }
    })

    // Reset transform on the cloned element to ensure correct export layout
    const clonedCanvas = clonedDoc.getElementById('design-canvas')
    if (clonedCanvas) {
      clonedCanvas.style.transform = 'none'
      clonedCanvas.style.border = 'none'
      clonedCanvas.style.boxShadow = 'none'
      clonedCanvas.style.margin = '0'
      clonedCanvas.style.padding = '0'
      clonedCanvas.style.left = '0'
      clonedCanvas.style.top = '0'
      clonedCanvas.style.position = 'relative'
    }
  }
})


export const exportAsPNG = async (elementId: string, filename: string = 'design') => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Canvas element not found')
  }

  try {
    const canvas = await html2canvas(element, getExportOptions())

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('Error exporting PNG:', error)
    throw error
  }
}

export const exportAsJPG = async (elementId: string, filename: string = 'design') => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Canvas element not found')
  }

  try {
    const canvas = await html2canvas(element, getExportOptions())

    const link = document.createElement('a')
    link.download = `${filename}.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.click()
  } catch (error) {
    console.error('Error exporting JPG:', error)
    throw error
  }
}

export const exportAsPDF = async (elementId: string, filename: string = 'design') => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Canvas element not found')
  }

  try {
    const canvas = await html2canvas(element, getExportOptions())

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw error
  }
}
