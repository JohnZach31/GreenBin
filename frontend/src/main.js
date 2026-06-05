import { initUploadExperience, showResult } from './ui.js'
import { analyzeWaste } from './api.js'

let fileName = 'No image selected yet.'

initUploadExperience({
  onFileSelected(file) {
    fileName = file.name
  },
  onAnalyze() {
    const city = document.getElementById('citySelect')?.value || 'Tel Aviv'
    const address = document.getElementById('addressInput')?.value || 'your location'

    return analyzeWaste({ city, address, fileName })
      .then((result) => {
        showResult(result)
        return result
      })
      .catch((error) => {
        console.error('Analysis failed:', error)
        const fallback = {
          item: 'Sample item',
          category: 'Plastic',
          confidence: '87%',
          bin: 'Yellow bin',
          location: 'GreenPoint Center',
          distance: '1.4 km away',
          status: 'Fallback result',
        }
        showResult(fallback)
        return fallback
      })
  },
})
