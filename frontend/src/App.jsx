import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/classify'

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('No image selected yet')

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

  const analyzeImage = async () => {
    if (!selectedFile) {
      setError('Please upload or take a photo first.')
      return
    }

    setIsAnalyzing(true)
    setResult(null)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Image analysis failed.')
      }

      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong while analyzing the image.')
    } finally {
      setIsAnalyzing(false)
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
            <span className="status-badge success">Backend ready</span>
          </div>

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
                <strong>Coming soon</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Distance</p>
                <strong>Coming soon</strong>
              </article>

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