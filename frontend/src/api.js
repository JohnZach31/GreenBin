export async function analyzeWaste({ city, address, file }) {
  console.log('api.js analyzeWaste called')
  console.log('file received in api.js:', file)

  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('http://localhost:3000/api/classify', {
    method: 'POST',
    body: formData,
  })

  console.log('Backend response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Backend error:', errorText)
    throw new Error('Failed to analyze waste image')
  }

  const result = await response.json()
  console.log('Backend JSON:', result)

  return {
    ...result,
    location: `${result.location} (${city})`,
    distance: `${result.distance} from ${address || 'your location'}`,
    status: 'Model result',
  }
}