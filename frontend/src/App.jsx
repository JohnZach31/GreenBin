import { useEffect, useState } from 'react'
import './App.css'
import { analyzeWaste } from './api'

function App() {
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileName, setFileName] = useState('No image selected yet')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleImageUpload = (file) => {
    console.log('handleImageUpload fired')
    console.log('file:', file)

    if (!file) {
      console.log('No file received')
      return
    }

    if (!file.type.startsWith('image/')) {
      console.log('Not an image:', file.type)
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setFileName(file.name)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)

    console.log('Image selected successfully:', file.name)
  }

  const onFileInputChange = (event) => {
    handleImageUpload(event.target.files?.[0])
  }

  const onDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleImageUpload(event.dataTransfer.files?.[0])
  }

  const analyzeImage = async () => {
    console.log('Analyze button clicked')
    console.log('selectedFile:', selectedFile)

    if (!selectedFile) {
      alert('No image selected')
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    const city = document.getElementById('city')?.value || 'Tel Aviv'
    const address = document.getElementById('address')?.value || ''

    try {
      console.log('Sending image to backend...')

      const realResult = await analyzeWaste({
        city,
        address,
        file: selectedFile,
      })

      console.log('Backend result:', realResult)
      setResult(realResult)
    } catch (error) {
      console.error('Analyze error:', error)

      setResult({
        item: 'Error',
        category: 'Could not analyze image',
        confidence: '-',
        bin: 'Please try again',
        location: 'Backend/model error',
        distance: error.message,
      })
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
            <article className="metric-card">
              82.7%<span>Model accuracy</span>
            </article>
            <article className="metric-card">
              6<span>Waste classes</span>
            </article>
            <article className="metric-card">
              ResNet<span>AI model</span>
            </article>
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
              <button
                className="ghost-button"
                type="button"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                Browse files
              </button>
            </div>

            <div className="preview-box">
              {previewUrl ? (
                <img src={previewUrl} alt="Uploaded preview" className="preview-image" />
              ) : (
                <span className="preview-placeholder">
                  Your selected image will appear here with a smooth, polished preview.
                </span>
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
            <input
              id="address"
              className="input-field"
              type="text"
              placeholder="Enter your street or landmark"
            />

            <button
              className="primary-button full-width"
              type="button"
              onClick={analyzeImage}
              disabled={isAnalyzing || !selectedFile}
            >
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
            <span className="status-badge success">Model result</span>
          </div>

          <p className="demo-note">
            This result comes from the local ResNet model through the backend.
          </p>

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
                <p className="result-label">Nearest recycling point</p>
                <strong>{result.location}</strong>
              </article>

              <article className="result-card">
                <p className="result-label">Distance</p>
                <strong>{result.distance}</strong>
              </article>
            </div>
          ) : (
            <div className="empty-result">
              <p>
                Once you upload an image and tap analyze, your smart recycling recommendation will appear here with a premium success state.
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