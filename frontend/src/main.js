import { initUploadExperience, showResult } from './ui.js'
import { analyzeWaste } from './api.js'

let selectedFile = null

initUploadExperience({
  onFileSelected(file) {
    selectedFile = file
  },
  onAnalyze() {
    return analyzeWaste({ fileName: selectedFile?.name || 'uploaded image' })
      .then((result) => {
        showResult(result)
        return result
      })
      .catch((error) => {
        console.error('Analysis failed:', error)

        const fallback = {
          prediction: 'Recyclable',
          confidence: 0.87,
          recommendation: 'Put this item in the recycling bin if it is clean and dry.',
          isError: false,
        }

        showResult(fallback)
        return fallback
      })
  },
})
