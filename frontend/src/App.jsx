import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/classify'

  const NEAREST_BIN_URL =
  import.meta.env.VITE_NEAREST_BIN_URL || 'http://localhost:3000/api/nearest-bin'

const CITY_FALLBACK_COORDS = {
  tel_aviv: {
    label: 'Tel Aviv',
    lat: 32.0853,
    lng: 34.7818,
  },
  rishon_lezion: {
    label: 'Rishon LeZion',
    lat: 31.973,
    lng: 34.7925,
  },
}

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('No image selected yet')
  const [processStatus, setProcessStatus] = useState('')

  const [selectedCity, setSelectedCity] = useState('rishon_lezion')
  const [locationStatus, setLocationStatus] = useState('Location will be requested when analyzing.')
  const [manualCategory, setManualCategory] = useState('textile')
  const [manualResult, setManualResult] = useState(null)
  const [isFindingManual, setIsFindingManual] = useState(false)
  const [manualError, setManualError] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)

  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [previewUrl])

  const isImageFile = (file) => {
    if (!file) return false

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif']
    const lowerName = file.name.toLowerCase()

    return (
      file.type.startsWith('image/') ||
      validExtensions.some((extension) => lowerName.endsWith(extension))
    )
  }

  const setImageFile = (file) => {
    if (!isImageFile(file)) {
      setError('Please choose a valid image file.')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSelectedFile(file)
    setFileName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const onFileInputChange = (event) => {
    setImageFile(event.target.files?.[0])
  }

  const onDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    setImageFile(event.dataTransfer.files?.[0])
  }

  const openCamera = async () => {
    setError('')

    if (!window.isSecureContext) {
      setError('Live camera requires HTTPS or localhost. Please use Take or Upload Photo instead.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported by this browser.')
      return
    }

    setIsCameraLoading(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setIsCameraOpen(true)
    } catch (err) {
      console.error(err)
      setError('Could not open camera. Please allow camera permissions in the browser.')
    } finally {
      setIsCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsCameraOpen(false)
  }

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) {
      setError('Camera is not ready yet.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not capture photo.')
          return
        }

        const file = new File([blob], 'camera-photo.jpg', {
          type: 'image/jpeg',
        })

        setImageFile(file)
      },
      'image/jpeg',
      0.95
    )
  }

  const getCurrentLocationOrFallback = async () => {
    const fallback = CITY_FALLBACK_COORDS[selectedCity]

    if (!navigator.geolocation || !window.isSecureContext) {
      setLocationStatus(
        `Using ${fallback.label} demo coordinates because browser location needs HTTPS or localhost.`
      )

      return {
        lat: fallback.lat,
        lng: fallback.lng,
        source: 'fallback',
      }
    }

    try {
      setLocationStatus('Requesting your location...')

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      setLocationStatus('Using your current location.')

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        source: 'gps',
      }
    } catch (err) {
      console.error(err)

      setLocationStatus(
        `Could not get your location. Using ${fallback.label} demo coordinates.`
      )

      return {
        lat: fallback.lat,
        lng: fallback.lng,
        source: 'fallback',
      }
    }
  }

  const analyzeImage = async () => {
    if (!selectedFile) {
      setError('Please upload or take a photo first.')
      return
    }

    setProcessStatus('Processing image...')
    setIsAnalyzing(true)
    setResult(null)
    setError('')

    try {
      const location = await getCurrentLocationOrFallback()

      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('lat', location.lat)
      formData.append('lng', location.lng)
      formData.append('city', selectedCity)

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Image analysis failed.')
      }

      setResult({
        ...data,
        locationSource: location.source,
      })
      setProcessStatus('Process done')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong while analyzing the image.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const findManualBin = async () => {
  setIsFindingManual(true)
  setManualResult(null)
  setManualError('')

  try {
    const location = await getCurrentLocationOrFallback()

    // Manual flow: no image, only category + location.
    const response = await fetch(NEAREST_BIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: manualCategory,
        city: selectedCity,
        lat: location.lat,
        lng: location.lng,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.details || data.error || 'Could not find nearest bin.')
    }

    setManualResult({
      ...data,
      locationSource: location.source,
    })
  } catch (err) {
    console.error(err)
    setManualError(err.message || 'Something went wrong while finding the bin.')
  } finally {
    setIsFindingManual(false)
  }
}

  const confidencePercent = result?.confidence
    ? `${Math.round(Number(result.confidence) * 100)}%`
    : 'Unavailable'

  const nearestPointDistance = result?.nearestPoint?.distanceMeters
    ? result.nearestPoint.distanceMeters >= 1000
      ? `${(result.nearestPoint.distanceMeters / 1000).toFixed(2)} km`
      : `${result.nearestPoint.distanceMeters} m`
    : 'Coming soon'

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top">GreenBin</a>

        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#upload">Upload</a>
          <a href="#camera">Camera</a>
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
              Identify waste instantly, choose the right bin, and get local recycling guidance.
            </p>

            <div className="cta-row">
              <a className="primary-button" href="#upload">Start Recycling</a>
              <span className="mini-pill">Upload • Camera • AI</span>
            </div>
          </div>

          <aside className="hero-metrics" aria-label="Highlights">
            <article className="metric-card">AI<span>Hugging Face model</span></article>
            <article className="metric-card">Live<span>Backend connected</span></article>
            <article className="metric-card">IL<span>Israel bin guidance</span></article>
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
              <span>PNG, JPG, JPEG, JFIF, WEBP — instant preview included.</span>
            </label>

            <input
              id="image-upload"
              className="hidden-input"
              type="file"
              accept="image/*,.jfif"
              capture="environment"
              onChange={onFileInputChange}
              disabled={isAnalyzing}
            />

            <div className="upload-meta">
              <p className="file-name">{fileName}</p>

              <button
                className="ghost-button"
                type="button"
                onClick={() => document.getElementById('image-upload').click()}
                disabled={isAnalyzing}
              >
                Take or Upload Photo
              </button>
            </div>

            <div className="preview-box">
              {previewUrl ? (
                <img src={previewUrl} alt="Selected waste preview" className="preview-image" />
              ) : (
                <span className="preview-placeholder">
                  Your selected image will appear here.
                </span>
              )}
            </div>
          </article>

          <article className="card-surface reveal" id="camera">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Camera</p>
                <h2>Take a live photo</h2>
              </div>

              <span className={`status-badge ${isCameraOpen ? 'success' : ''}`}>
                {isCameraOpen ? 'Camera open' : 'Ready'}
              </span>
            </div>

            {!isCameraOpen ? (
              <button
                className="primary-button full-width"
                type="button"
                onClick={openCamera}
                disabled={isCameraLoading || isAnalyzing}
              >
                {isCameraLoading ? <span className="spinner" aria-hidden="true" /> : 'Open Camera'}
                {isCameraLoading ? ' Opening camera...' : ''}
              </button>
            ) : (
              <>
                <div className="camera-box">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />
                </div>

                <div className="camera-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={takePhoto}
                    disabled={isAnalyzing}
                  >
                    Take Photo
                  </button>

                  <button
                    className="ghost-button"
                    type="button"
                    onClick={stopCamera}
                    disabled={isAnalyzing}
                  >
                    Close Camera
                  </button>
                </div>
              </>
            )}

            <canvas ref={canvasRef} className="hidden-canvas" />

            <p className="camera-helper">
              Live camera preview works on localhost or HTTPS. On mobile testing, use “Take or Upload Photo”.
            </p>
          </article>
        </section>

        <section className="card-surface reveal" aria-label="Analyze section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Analyze</p>
              <h2>Send image to model</h2>
            </div>
          </div>

          {processStatus && (
  <div className={`process-status ${processStatus === 'Process done' ? 'done' : ''}`}>
    <span>{processStatus}</span>

    {processStatus === 'Process done' && (
      <a className="ghost-button small-action" href="#results">
        View results
      </a>
    )}
  </div>
)}

          <label className="field-label" htmlFor="city">
            City
          </label>

          <select
            id="city"
            className="input-field"
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            disabled={isAnalyzing}
          >
            <option value="rishon_lezion">Rishon LeZion</option>
            <option value="tel_aviv">Tel Aviv</option>
          </select>

          <p className="location-message">
            {locationStatus}
          </p>

          <button
            className="primary-button full-width"
            type="button"
            onClick={analyzeImage}
            disabled={isAnalyzing || !selectedFile}
          >
            {isAnalyzing ? <span className="spinner" aria-hidden="true" /> : 'Analyze Waste'}
            {isAnalyzing ? ' Analyzing image...' : ''}
          </button>

          {isAnalyzing && (
            <p className="loading-message">
              The model is processing your image. First run may take a little longer.
            </p>
          )}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}
        </section>

        <section className="card-surface reveal" aria-label="Manual recycling search">
  <div className="section-heading">
    <div>
      <p className="eyebrow">Manual search</p>
      <h2>Find a recycling point without AI</h2>
    </div>
    <span className="status-badge">Manual mode</span>
  </div>

  <label className="field-label" htmlFor="manual-category">
    Recycling category
  </label>

  <select
    id="manual-category"
    className="input-field"
    value={manualCategory}
    onChange={(event) => setManualCategory(event.target.value)}
    disabled={isFindingManual}
  >
    <option value="plastic_packaging">Plastic & Packaging</option>
    <option value="paper">Paper</option>
    <option value="glass">Glass</option>
    <option value="cardboard">Cardboard</option>
    <option value="textile">Textile</option>
    <option value="electronic_waste">Electronic Waste</option>
  </select>

  <button
    className="primary-button full-width"
    type="button"
    onClick={findManualBin}
    disabled={isFindingManual}
  >
    {isFindingManual ? <span className="spinner" aria-hidden="true" /> : 'Find Nearest Bin'}
    {isFindingManual ? ' Finding nearest bin...' : ''}
  </button>

  {manualError && (
    <p className="error-message">
      {manualError}
    </p>
  )}

  {manualResult?.nearestPoint && (
    <div className="result-grid manual-result-grid">
      <article className="result-card highlight-card">
        <p className="result-label">Nearest point</p>
        <strong>
          {manualResult.nearestPoint.name || manualResult.nearestPoint.address}
        </strong>
      </article>

      <article className="result-card">
        <p className="result-label">Address</p>
        <strong>{manualResult.nearestPoint.address}</strong>
      </article>

      {manualResult.nearestPoint.lat && manualResult.nearestPoint.lng && (
        <article className="result-card demo-banner-card">
          <p className="result-label">Open in map</p>
          <a
            className="ghost-button"
            href={`https://www.google.com/maps/search/?api=1&query=${manualResult.nearestPoint.lat},${manualResult.nearestPoint.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Google Maps
          </a>
        </article>
      )}
    </div>
  )}

  {manualResult && !manualResult.nearestPoint && (
    <p className="empty-result">
      No matching recycling point found for this category yet.
    </p>
  )}
</section>

        <section className="card-surface reveal" id="results">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Result</p>
              <h2>Recycling recommendation</h2>
            </div>

            <span className={`status-badge ${result ? 'success' : ''}`}>
              {result ? 'Backend result' : 'Waiting'}
            </span>
          </div>

          {result ? (
            <div className="result-grid">
              <article className="result-card highlight-card">
                <p className="result-label">Detected item</p>
                <strong>{result.displayname || result.rawLabel || 'Unknown item'}</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Category</p>
                <strong>{result.category}</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Confidence</p>
                <strong>{confidencePercent}</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Recommended bin</p>
                <strong>{result.bin}</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Nearest recycling point</p>
                <strong>
                  {result.nearestPoint?.name ||
                    result.nearestPoint?.address ||
                    'No matching point found yet'}
                </strong>
              </article>

              <article className="result-card">
                <p className="result-label">Address</p>
                <strong>{result.nearestPoint?.address || 'Coming soon'}</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Location source</p>
                <strong>{result.locationSource || 'Unknown'}</strong>
              </article>

              {result.nearestPoint?.lat && result.nearestPoint?.lng && (
                <article className="result-card demo-banner-card">
                  <p className="result-label">Open in map</p>
                  <a
                    className="ghost-button"
                    href={`https://www.google.com/maps/search/?api=1&query=${result.nearestPoint.lat},${result.nearestPoint.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Google Maps
                  </a>
                </article>
              )}

              {result.topPredictions?.length > 0 && (
                <article className="result-card demo-banner-card">
                  <p className="result-label">Top predictions</p>

                  <div className="prediction-list">
                    {result.topPredictions.map((prediction) => (
                      <span className="prediction-pill" key={prediction.label}>
                        {prediction.label} · {Math.round(Number(prediction.confidence) * 100)}%
                      </span>
                    ))}
                  </div>
                </article>
              )}
            </div>
          ) : (
            <div className="empty-result">
              <p>
                Upload an image or take a photo, then tap analyze. Your backend result will appear here.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="footer-card" id="contact">
        <p>GREENBIN • Sustainable recycling guidance for a cleaner future.</p>
      </footer>
    </div>
  )
}

export default App