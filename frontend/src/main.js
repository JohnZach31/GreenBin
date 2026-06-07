import { initUploadExperience, showResult } from './ui.js'
import { analyzeWaste } from './api.js'

let selectedFile = null

initUploadExperience({
  onFileSelected(file) {
    selectedFile = file
    console.log('Selected file:', selectedFile)
  },

  onAnalyze() {
    if (!selectedFile) {
      const noFileResult = {
        item: 'No image selected',
        category: '-',
        confidence: '-',
        bin: 'Please upload an image first',
        location: '-',
        distance: '-',
        status: 'Waiting for image',
      }

      showResult(noFileResult)
      return Promise.resolve(noFileResult)
    }

    const city = document.getElementById('citySelect')?.value || 'Tel Aviv'
    const address = document.getElementById('addressInput')?.value || 'your location'

    console.log('Sending real file to backend:', selectedFile)

    return analyzeWaste({
      city,
      address,
      file: selectedFile,
    })
      .then((result) => {
        console.log('Real model result:', result)
        showResult(result)
        return result
      })
      .catch((error) => {
        console.error('Analysis failed:', error)

        const errorResult = {
          item: 'Error',
          category: 'Could not analyze image',
          confidence: '-',
          bin: 'Please check that the backend is running',
          location: 'Backend/model error',
          distance: error.message,
          status: 'Error',
        }

        showResult(errorResult)
        return errorResult
      })
  },
})