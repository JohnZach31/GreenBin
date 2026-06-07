const refs = {
  dropZone: document.getElementById('dropZone'),
  imageInput: document.getElementById('imageInput'),
  previewBox: document.getElementById('previewBox'),
  fileName: document.getElementById('fileName'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  resultBadge: document.getElementById('resultBadge'),
  itemName: document.getElementById('itemName'),
  categoryName: document.getElementById('categoryName'),
  confidenceLevel: document.getElementById('confidenceLevel'),
  binName: document.getElementById('binName'),
  locationName: document.getElementById('locationName'),
  distanceText: document.getElementById('distanceText'),
}

function setPreview(file) {
  if (!file) return

  const previewUrl = URL.createObjectURL(file)
  refs.previewBox.innerHTML = `<img src="${previewUrl}" alt="Uploaded waste preview" class="h-56 w-full rounded-2xl object-cover" />`
  refs.fileName.textContent = `Selected: ${file.name}`
}

export function initUploadExperience({ onFileSelected, onAnalyze }) {
  if (!refs.dropZone || !refs.imageInput || !refs.analyzeBtn) return

  refs.imageInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setPreview(file)
    onFileSelected(file)
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
    setPreview(file)
    onFileSelected(file)
  })

  refs.analyzeBtn.addEventListener('click', async () => {
    refs.analyzeBtn.disabled = true
    refs.analyzeBtn.innerHTML = '<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> Analyzing…'
    refs.resultBadge.textContent = 'Analyzing…'

    try {
      await onAnalyze()
    } finally {
      refs.analyzeBtn.disabled = false
      refs.analyzeBtn.textContent = 'Analyze Waste'
    }
  })
}

export function showResult(result) {
  refs.itemName.textContent = result.item
  refs.categoryName.textContent = result.category
  refs.confidenceLevel.textContent = result.confidence
  refs.binName.textContent = result.bin
  refs.locationName.textContent = result.location
  refs.distanceText.textContent = result.distance
  refs.resultBadge.textContent = result.status || 'Ready'

  document.querySelectorAll('.result-card').forEach((card) => {
    card.classList.add('animate-pulse')
    setTimeout(() => card.classList.remove('animate-pulse'), 700)
  })
}
