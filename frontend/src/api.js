const mockResults = [
  {
    item: 'Plastic Bottle',
    category: 'Plastic Recycling',
    confidence: '94%',
    bin: 'Yellow Recycling Bin',
    location: 'GreenPoint Recycling Hub, Tel Aviv',
    distance: '1.2 km away',
    status: 'Ready',
  },
  {
    item: 'Glass Jar',
    category: 'Glass Recycling',
    confidence: '91%',
    bin: 'Blue Glass Bin',
    location: 'EcoDrop Center, Rishon LeZion',
    distance: '2.1 km away',
    status: 'Ready',
  },
  {
    item: 'Paper Box',
    category: 'Paper Recycling',
    confidence: '89%',
    bin: 'Green Paper Bin',
    location: 'Urban Recycle Station',
    distance: '3.4 km away',
    status: 'Ready',
  },
]

export function analyzeWaste({ city, address, fileName }) {
  return new Promise((resolve) => {
    const seed = fileName?.toLowerCase().includes('glass')
      ? 1
      : fileName?.toLowerCase().includes('paper')
        ? 2
        : 0

    setTimeout(() => {
      resolve({
        ...mockResults[seed],
        location: `${mockResults[seed].location} (${city})`,
        distance: `${city === 'Rishon LeZion' ? '2.8' : '1.2'} km from ${address || 'your location'}`,
      })
    }, 900)
  })
}
