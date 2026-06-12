const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export async function analyzeWaste(imageFile) {
  const file = imageFile instanceof File ? imageFile : imageFile?.file

  if (!(file instanceof File)) {
    throw new Error('analyzeWaste expects an image File object.')
  }

  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const message = data?.message || data?.error || 'Image classification request failed.'
      throw new Error(message)
    }

    return data
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to contact the classification server.'

    throw new Error(message)
  }
}
