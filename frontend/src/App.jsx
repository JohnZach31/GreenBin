import { useEffect, useState } from 'react'
import './App.css'
import { analyzeWaste } from './api.js'

function App() {
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('No image selected yet')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const resetScanState = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl('')
    setFileName('No image selected yet')
    setSelectedFile(null)
    setIsDragging(false)
    setIsAnalyzing(false)
    setResult(null)
    setErrorMessage('')

    const imageInput = document.getElementById('image-upload')
    if (imageInput) {
      imageInput.value = ''
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSelectedFile(file)
    setFileName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
    setIsAnalyzing(false)
    setResult(null)
    setErrorMessage('')
  }

  const onFileInputChange = (event) => {
    handleImageUpload(event.target.files?.[0])
  }

  const onDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleImageUpload(event.dataTransfer.files?.[0])
  }

  const formatTextValue = (value) => {
    if (typeof value === 'string') {
      return value.trim() || '—'
    }

    return value ?? '—'
  }

  const formatConfidence = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${Math.round(value * 100)}%`
    }

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    return '—'
  }

  const formatLocation = (nearestPoint) => {
    if (!nearestPoint) return '—'

    const city = typeof nearestPoint.city === 'string' ? nearestPoint.city.trim() : ''
    const address = typeof nearestPoint.address === 'string' ? nearestPoint.address.trim() : ''

    if (city && address) return `${city} — ${address}`
    return city || address || '—'
  }

  const formatDistance = (value) => {
    if (value == null) return '—'

    const distance = Number(value)
    if (!Number.isFinite(distance)) return '—'

    return `${distance % 1 === 0 ? distance : distance.toFixed(1)} km`
  }

  const getGoogleMapsUrl = (nearestPoint) => {
    const latitude = Number(nearestPoint?.latitude ?? nearestPoint?.lat)
    const longitude = Number(nearestPoint?.longitude ?? nearestPoint?.lng)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return ''
    }

    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }

  const analyzeImage = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setErrorMessage('')
    setResult(null)

    try {
      const response = await analyzeWaste(selectedFile)

      if (!response?.success) {
        setErrorMessage(response?.message || 'The analysis request failed.')
        return
      }

      const nearestPoint = response.nearestPoint || response.nearestBin || null
      const googleMapsUrl = getGoogleMapsUrl(nearestPoint)

      setResult({
        item: formatTextValue(response.detectedItem),
        category: formatTextValue(response.category),
        confidence: formatConfidence(response.confidence),
        bin: formatTextValue(response.recommendedBin),
        recommendation: formatTextValue(response.recommendation),
        location: formatLocation(nearestPoint),
        distance: formatDistance(nearestPoint?.distanceKm ?? response.nearestBin?.distanceKm),
        nearestBin: {
          name: formatTextValue(nearestPoint?.name || nearestPoint?.address || nearestPoint?.city),
          distance: formatDistance(nearestPoint?.distanceKm ?? response.nearestBin?.distanceKm),
          mapsUrl: googleMapsUrl,
        },
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to contact the classification server.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top">GreenBin</a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#upload">Upload</a>
          <a href="#results">Results</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="app-shell" id="top">
        <section className="hero-card card-surface reveal">
          <div>
            <p className="eyebrow">Eco-friendly recycling assistant</p>
            <h1 className="title">GreenBin</h1>
            <p className="description">
              Identify waste instantly, choose the right bin, and find the nearest recycling point with a calm, premium experience.
            </p>
            <div className="cta-row">
              <a className="primary-button" href="#upload">Start Recycling</a>
              <span className="mini-pill">Fast • Smart • Clean</span>
            </div>
          </div>

          <aside className="hero-metrics" aria-label="Highlights">
            <article className="metric-card">98%<span>Accuracy</span></article>
            <article className="metric-card">24/7<span>Local guidance</span></article>
            <article className="metric-card">4.9/5<span>User rating</span></article>
          </aside>
        </section>

        <section className="content-grid">
          <article className="card-surface reveal" id="upload">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Upload image</p>
                <h2>Drop your waste photo here</h2>
              </div>
              <span className="status-badge">Live preview</span>
            </div>

            <label
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              htmlFor="image-upload"
            >
              <span className="upload-icon">📷</span>
              <strong>Choose a photo or drag it here</strong>
              <span>PNG, JPG, WEBP — instant preview included.</span>
            </label>

            <input
              id="image-upload"
              className="hidden-input"
              type="file"
              accept="image/*"
              onChange={onFileInputChange}
            />

            <div className="upload-meta">
              <p className="file-name">{fileName}</p>
              <button className="ghost-button" type="button" onClick={() => document.getElementById('image-upload').click()}>
                Browse files
              </button>
            </div>

            <div className="preview-box">
              {previewUrl ? (
                <img src={previewUrl} alt="Uploaded preview" className="preview-image" />
              ) : (
                <span className="preview-placeholder">Your selected image will appear here with a smooth, polished preview.</span>
              )}
            </div>
          </article>

          <article className="card-surface reveal" aria-label="Location details">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Location</p>
                <h2>Find the nearest point</h2>
              </div>
              <span className="status-badge success">Ready</span>
            </div>

            <label className="field-label" htmlFor="city">City</label>
            <select id="city" className="input-field" defaultValue="Tel Aviv">
              <option>Tel Aviv</option>
              <option>Rishon LeZion</option>
            </select>

            <label className="field-label" htmlFor="address">Address</label>
            <input id="address" className="input-field" type="text" placeholder="Enter your street or landmark" />

            <button className="primary-button full-width" type="button" onClick={analyzeImage} disabled={isAnalyzing || !previewUrl} aria-disabled={isAnalyzing || !previewUrl}>
              {isAnalyzing ? <span className="spinner" aria-hidden="true" /> : 'Analyze Waste'}
              {isAnalyzing ? ' Analyzing...' : ''}
            </button>
          </article>
        </section>

        <section className="card-surface reveal" id="results">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Result</p>
              <h2>Recycling recommendation</h2>
            </div>
            <span className="status-badge success">Live API result</span>
          </div>

          {isAnalyzing ? (
            <div className="loading-card" role="status" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <div>
                <strong>Analyzing your image…</strong>
                <p>Checking the waste type and the best recycling guidance from the live backend response.</p>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="error-card" role="alert">
              <div>
                <p className="eyebrow">Analysis failed</p>
                <strong>We could not complete the request.</strong>
              </div>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {result ? (
            <div className="result-grid">
              <article className="result-card highlight-card">
                <p className="result-label">Detected item</p>
                <strong>{result.item}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Category</p>
                <strong>{result.category}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Confidence</p>
                <strong>{result.confidence}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Recommended bin</p>
                <strong>{result.bin}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Recommendation</p>
                <strong>{result.recommendation}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Nearest bin</p>
                <strong>{result.nearestBin?.name || result.location || '—'}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Distance</p>
                <strong>{result.nearestBin?.distance || result.distance || '—'}</strong>
              </article>
              <article className="result-card">
                <p className="result-label">Map</p>
                {result.nearestBin?.mapsUrl ? (
                  <a
                    className="maps-link"
                    href={result.nearestBin.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                ) : (
                  <strong>—</strong>
                )}
              </article>
            </div>
          ) : (
            <div className="empty-result">
              <p>Once you upload an image and tap analyze, the live recycling recommendation from the backend will appear here.</p>
            </div>
          )}

          {(result || errorMessage || previewUrl) ? (
            <div className="result-actions">
              <button className="ghost-button" type="button" onClick={resetScanState} disabled={isAnalyzing}>
                Scan another
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="footer-card" id="contact">
        <p>GREENBIN • Sustainable recycling guidance for a cleaner future.</p>
      </footer>
    </div>
  )
}

export default App