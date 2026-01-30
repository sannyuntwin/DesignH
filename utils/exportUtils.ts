import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const exportAsPNG = async (elementId: string, filename: string = 'design') => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Canvas element not found')
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    })

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
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    })

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
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    })

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
