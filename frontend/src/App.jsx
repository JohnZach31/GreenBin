import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/classify'

const NEAREST_BIN_URL =
  import.meta.env.VITE_NEAREST_BIN_URL || 'http://localhost:3000/api/nearest-bin'

const CITY_FALLBACK_COORDS = {
  rishon_lezion: {
    label: 'Rishon LeZion',
    lat: 31.973,
    lng: 34.7925,
  },
  tel_aviv: {
    label: 'Tel Aviv',
    lat: 32.0853,
    lng: 34.7818,
  },
  holon: {
    label: 'Holon',
    lat: 32.0158,
    lng: 34.7874,
  },
  rehovot: {
    label: 'Rehovot',
    lat: 31.8948,
    lng: 34.8113,
  },
  haifa: {
    label: 'Haifa',
    lat: 32.794,
    lng: 34.9896,
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
  const [locationStatus, setLocationStatus] = useState(
    'Location will be requested when analyzing.'
  )

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
  const [recyclingQueue, setRecyclingQueue] = useState([])

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
    setProcessStatus('')
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
      setError(
        'Live camera requires HTTPS or localhost. Please use Take or Upload Photo instead.'
      )
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
        stopCamera()
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

  const createQueueId = () => {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const getMapUrl = (point) => {
    if (!point) return '#'

    return (
      point.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        point.address
      )}`
    )
  }

  const removeQueueItem = (queueItemId) => {
    setRecyclingQueue((currentQueue) =>
      currentQueue.filter((item) => item.id !== queueItemId)
    )
  }

  const clearQueue = () => {
    setRecyclingQueue([])
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

      setRecyclingQueue((currentQueue) => [
        ...currentQueue,
        {
          id: createQueueId(),
          imageName: selectedFile.name,
          displayname: data.displayname || data.rawLabel || 'Unknown item',
          category: data.category,
          bin: data.bin,
          confidence: data.confidence,
          nearestPoint: data.nearestPoint,
          locationSource: location.source,
        },
      ])

      setProcessStatus('Process done')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong while analyzing the image.')
      setProcessStatus('')
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

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top">GreenBin</a>

        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#upload">Upload</a>
          <a href="#analyze">Analyze</a>
          <a href="#queue">Queue</a>
          <a href="#manual">Manual</a>
          <a href="#camera">Camera</a>
          <a href="#results">Results</a>
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
              <span className="mini-pill">Upload • AI • Local guidance</span>
            </div>
          </div>

          <aside className="hero-metrics" aria-label="Highlights">
            <article className="metric-card">AI<span>Hugging Face model</span></article>
            <article className="metric-card">632<span>Multi-city demo points</span></article>
            <article className="metric-card">IL<span>Israel bin guidance</span></article>
          </aside>
        </section>

        <section className="workflow-grid">
          <article className="card-surface reveal upload-card" id="upload">
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
                <img
                  src={previewUrl}
                  alt="Selected waste preview"
                  className="preview-image"
                />
              ) : (
                <span className="preview-placeholder">
                  Your selected image will appear here.
                </span>
              )}
            </div>
          </article>

          <article className="card-surface reveal analyze-card" id="analyze">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Analyze</p>
                <h2>Send image to model</h2>
              </div>
              <span className="status-badge">Step 2</span>
            </div>

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
              <option value="holon">Holon</option>
              <option value="rehovot">Rehovot</option>
              <option value="haifa">Haifa</option>
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
              <div className="processing-box">
                <div className="processing-header">
                  <span>Processing image...</span>
                  <span>AI model running</span>
                </div>

                <div className="processing-bar">
                  <div className="processing-bar-fill" />
                </div>

                <p className="processing-note">
                  First run may take a little longer while the model wakes up.
                </p>
              </div>
            )}

            {processStatus === 'Process done' && !isAnalyzing && (
              <div className="process-status done">
                <span>Process done</span>

                <a className="ghost-button small-action" href="#results">
                  View results
                </a>
              </div>
            )}

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}
          </article>
        </section>

        <section className="card-surface reveal queue-card" id="queue">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recycling queue</p>
              <h2>Build a recycling plan from multiple photos</h2>
            </div>

            <span className="status-badge">
              {recyclingQueue.length} item{recyclingQueue.length === 1 ? '' : 's'}
            </span>
          </div>

          {recyclingQueue.length > 0 ? (
            <>
              <div className="queue-actions">
                <p className="queue-helper">
                  Analyze several waste photos and GreenBin will keep them as a sorted recycling plan.
                </p>

                <button className="ghost-button" type="button" onClick={clearQueue}>
                  Clear queue
                </button>
              </div>

              <div className="queue-list">
                {recyclingQueue.map((item, index) => (
                  <article className="queue-item" key={item.id}>
                    <div className="queue-index">{index + 1}</div>

                    <div className="queue-content">
                      <strong>{item.displayname}</strong>
                      <span>{item.imageName}</span>

                      <div className="queue-pills">
                        <span>{item.category}</span>
                        <span>{item.bin}</span>
                        <span>
                          {item.confidence
                            ? `${Math.round(Number(item.confidence) * 100)}% confidence`
                            : 'Confidence unavailable'}
                        </span>
                      </div>

                      {item.nearestPoint?.address && (
                        <p className="queue-address">
                          Nearest point: {item.nearestPoint.address}
                        </p>
                      )}
                    </div>

                    <div className="queue-buttons">
                      {item.nearestPoint?.address && (
                        <a
                          className="ghost-button"
                          href={getMapUrl(item.nearestPoint)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Maps
                        </a>
                      )}

                      <button
                        className="ghost-button danger-ghost"
                        type="button"
                        onClick={() => removeQueueItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-result">
              <p>
                Your queue is empty. Analyze an image and it will be added here automatically.
              </p>
            </div>
          )}
        </section>

        <section className="card-surface reveal manual-card" id="manual">
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

              <article className="result-card">
                <p className="result-label">Bin type</p>
                <strong>{manualResult.nearestPoint.bin}</strong>
              </article>

              <article className="result-card demo-banner-card">
                <p className="result-label">Open in map</p>
                <a
                  className="ghost-button"
                  href={getMapUrl(manualResult.nearestPoint)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Google Maps
                </a>
              </article>
            </div>
          )}

          {manualResult && !manualResult.nearestPoint && (
            <p className="empty-result">
              No matching recycling point found for this category yet.
            </p>
          )}
        </section>

        <section className="card-surface reveal camera-card" id="camera">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Camera</p>
              <h2>Optional live camera</h2>
            </div>

            <span className={`status-badge ${isCameraOpen ? 'success' : ''}`}>
              {isCameraOpen ? 'Camera open' : 'Optional'}
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
            Live camera preview works on localhost or HTTPS. On mobile testing,
            use “Take or Upload Photo”.
          </p>
        </section>

        <section className="card-surface reveal results-section" id="results">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Result</p>
              <h2>Recycling recommendation</h2>
            </div>

            <span className={`status-badge ${result ? 'success' : ''}`}>
              {result ? 'Result ready' : 'Waiting'}
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

              {result.nearestPoint?.address && (
                <article className="result-card demo-banner-card">
                  <p className="result-label">Open in map</p>
                  <a
                    className="ghost-button"
                    href={getMapUrl(result.nearestPoint)}
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
                Upload an image, then tap analyze. Your recommendation will appear here.
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