const defaultApiUrl = 'http://127.0.0.1:8000'

export type HealthResponse = {
  status: string
  service: string
  environment: string
  debug: boolean
}

export async function fetchHealth(): Promise<HealthResponse> {
  const apiUrl = import.meta.env.VITE_API_URL ?? defaultApiUrl
  const response = await fetch(`${apiUrl}/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return response.json() as Promise<HealthResponse>
}
