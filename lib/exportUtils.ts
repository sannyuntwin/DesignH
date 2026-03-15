import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const getExportOptions = (element: HTMLElement) => ({
  backgroundColor: '#ffffff', // Ensure a solid background for the export
  scale: 4, // 4x scale for high quality
  logging: true, // Enable logging for troubleshooting if needed
  useCORS: true,
  allowTaint: false, // Don't allow tainted canvases as they break toDataURL
  scrollX: 0,
  scrollY: 0,
  windowWidth: element.offsetWidth,
  windowHeight: element.offsetHeight,
  onclone: (clonedDoc: Document) => {
    // Hide all elements with the 'no-export' class
    const noExportElements = clonedDoc.querySelectorAll('.no-export')
    noExportElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none'
      }
    })

    // Remove 'selected' class and outlines from design elements to ensure clean export
    const selectedElements = clonedDoc.querySelectorAll('.selected')
    selectedElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.classList.remove('selected')
        el.style.outline = 'none'
        el.style.boxShadow = 'none'
      }
    })

    // Prepare the design-canvas for export
    const clonedCanvas = clonedDoc.getElementById('design-canvas')
    if (clonedCanvas) {
      // RESET ALL INTERFERING STYLES
      clonedCanvas.style.transform = 'none'
      clonedCanvas.style.transition = 'none'
      clonedCanvas.style.border = 'none'
      clonedCanvas.style.boxShadow = 'none'
      clonedCanvas.style.margin = '0'
      clonedCanvas.style.padding = '0'
      clonedCanvas.style.left = '0'
      clonedCanvas.style.top = '0'
      clonedCanvas.style.position = 'absolute' // Force absolute to avoid page layout shifts
      clonedCanvas.style.backgroundColor = '#ffffff' // Force white background

      // Ensure the cloned document body or container doesn't shift the canvas
      clonedCanvas.parentElement!.style.padding = '0'
      clonedCanvas.parentElement!.style.margin = '0'
      clonedCanvas.parentElement!.style.display = 'block'
      clonedCanvas.parentElement!.style.width = `${element.offsetWidth}px`
      clonedCanvas.parentElement!.style.height = `${element.offsetHeight}px`
    }
  }
})


export const exportAsPNG = async (elementId: string, filename: string = 'design') => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Canvas element not found')
  }

  try {
    const canvas = await html2canvas(element, getExportOptions(element))

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
    const canvas = await html2canvas(element, getExportOptions(element))

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
    const canvas = await html2canvas(element, getExportOptions(element))

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
