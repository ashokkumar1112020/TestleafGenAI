import { GenerateRequest, GenerateResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api'

export async function generateTests(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    // Defensive: ensure testcaseCount (if provided) is an integer between 1 and 20
    if (typeof (request as any).testcaseCount !== 'undefined') {
      const n = Number((request as any).testcaseCount)
      if (!Number.isInteger(n) || n < 1 || n > 20) {
        throw new Error('testcaseCount must be an integer between 1 and 20')
      }
      ;(request as any).testcaseCount = n
    }
    const response = await fetch(`${API_BASE_URL}/generate-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: GenerateResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error generating tests:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

export async function fetchJiraIssue(jiraId: string): Promise<{ summary: string; description: string; acceptanceCriteria: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/jira/${encodeURIComponent(jiraId)}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    const data = await res.json()
    return {
      summary: data.summary || '',
      description: data.description || '',
      // Always return a string (default to empty string when missing/null)
      acceptanceCriteria: typeof data.acceptanceCriteria !== 'undefined' && data.acceptanceCriteria !== null ? String(data.acceptanceCriteria) : ''
    }
  } catch (error) {
    console.error('Error fetching JIRA issue:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch JIRA issue')
  }
}