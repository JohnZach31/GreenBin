const refs = {
  dropZone: document.getElementById('dropZone'),
  imageInput: document.getElementById('imageInput'),
  previewBox: document.getElementById('previewBox'),
  fileName: document.getElementById('fileName'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  resultBadge: document.getElementById('resultBadge'),
  predictionValue: document.getElementById('predictionValue'),
  confidenceValue: document.getElementById('confidenceValue'),
  recommendationValue: document.getElementById('recommendationValue'),
  uploadHint: document.getElementById('uploadHint'),
}

function setPreview(file) {
  if (!file) return

  const previewUrl = URL.createObjectURL(file)
  refs.previewBox.innerHTML = `<img src="${previewUrl}" alt="Uploaded waste preview" class="h-56 w-full rounded-2xl object-cover" />`
  refs.fileName.textContent = `Selected: ${file.name}`
}

export function initUploadExperience({ onFileSelected, onAnalyze }) {
  if (!refs.dropZone || !refs.imageInput || !refs.analyzeBtn) return

  refs.analyzeBtn.disabled = true
  refs.resultBadge.textContent = 'Waiting for image'

  const updateReadyState = (file) => {
    setPreview(file)
    onFileSelected(file)
    refs.analyzeBtn.disabled = false

    if (refs.resultBadge) {
      refs.resultBadge.textContent = 'Image ready'
    }

    if (refs.uploadHint) {
      refs.uploadHint.textContent = 'Image ready. Click Analyze to preview the recommendation.'
    }
  }

  refs.imageInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    updateReadyState(file)
  })

  refs.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault()
    refs.dropZone.classList.add('ring-2', 'ring-emerald-400')
  })

  refs.dropZone.addEventListener('dragleave', () => {
    refs.dropZone.classList.remove('ring-2', 'ring-emerald-400')
  })

  refs.dropZone.addEventListener('drop', (event) => {
    event.preventDefault()
    refs.dropZone.classList.remove('ring-2', 'ring-emerald-400')
    const file = event.dataTransfer?.files?.[0]
    if (!file) return

    refs.imageInput.files = event.dataTransfer.files
    updateReadyState(file)
  })

  refs.analyzeBtn.addEventListener('click', async () => {
    if (!refs.imageInput.files?.length) return

    const originalText = refs.analyzeBtn.textContent

    refs.analyzeBtn.disabled = true
    refs.analyzeBtn.innerHTML = '<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> Analyzing…'
    refs.resultBadge.textContent = 'Analyzing…'

    if (refs.uploadHint) {
      refs.uploadHint.textContent = 'Analyzing your image…'
    }

    if (refs.resultBadge) {
      refs.resultBadge.textContent = 'Analyzing…'
    }

    try {
      await onAnalyze()
    } finally {
      refs.analyzeBtn.disabled = false
      refs.analyzeBtn.textContent = originalText
    }
  })
}

export function showResult(result) {
  if (refs.predictionValue) {
    refs.predictionValue.textContent = result.prediction || '—'
  }

  if (refs.confidenceValue) {
    const confidencePercent = typeof result.confidence === 'number'
      ? `${Math.round(result.confidence * 100)}%`
      : result.confidence || '—'

    refs.confidenceValue.textContent = confidencePercent
  }

  if (refs.recommendationValue) {
    refs.recommendationValue.textContent = result.recommendation || 'No recommendation available yet.'
  }

  refs.resultBadge.textContent = result.isError ? 'Error' : 'Ready'

  if (refs.uploadHint) {
    refs.uploadHint.textContent = result.isError
      ? 'The analysis could not be completed. Please check the backend connection.'
      : 'Analysis complete. You can upload another image at any time.'
  }

  document.querySelectorAll('.result-card').forEach((card) => {
    card.classList.add('animate-pulse')
    setTimeout(() => card.classList.remove('animate-pulse'), 700)
  })
}

export function showError(message) {
  showResult({
    prediction: 'Analysis unavailable',
    confidence: '—',
    recommendation: message,
    isError: true,
  })
}
