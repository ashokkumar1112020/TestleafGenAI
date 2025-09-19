import fetch from 'node-fetch'

export interface JiraIssue {
  summary: string
  description: string
  acceptanceCriteria?: string
}

export class JiraService {
  private baseUrl: string | undefined
  private username: string | undefined
  private apiToken: string | undefined

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL
    this.username = process.env.JIRA_USERNAME
    this.apiToken = process.env.JIRA_API_TOKEN
  }

  isConfigured() {
    return !!(this.baseUrl && this.username && this.apiToken)
  }

  // Simple helper to convert Atlassian Document Format (ADF) to plain text when possible
  private adfToText(adf: any): string {
    try {
      if (!adf) return ''
      // adf is typically an object with content -> paragraphs -> text
      const parts: string[] = []
      const walk = (node: any) => {
        if (!node) return
        if (Array.isArray(node)) {
          node.forEach(walk)
        } else if (typeof node === 'string') {
          parts.push(node)
        } else if (node.type === 'text' && typeof node.text === 'string') {
          parts.push(node.text)
        } else if (node.content) {
          walk(node.content)
        }
      }
      walk(adf)
      return parts.join('\n')
    } catch (err) {
      return ''
    }
  }

  async getIssue(jiraId: string): Promise<JiraIssue> {
    // If not configured, caller should treat response as mock
    if (!this.isConfigured()) {
      return {
        summary: `MOCK: ${jiraId} - Sample Story Title`,
        description: `MOCK: This is a mock description for JIRA ID ${jiraId}. Set JIRA_BASE_URL, JIRA_USERNAME and JIRA_API_TOKEN in .env to enable real integration.`
      }
    }

    const url = `${this.baseUrl!.replace(/\/$/, '')}/rest/api/2/issue/${encodeURIComponent(jiraId)}`

    const basic = Buffer.from(`${this.username!}:${this.apiToken!}`).toString('base64')

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${basic}`
      }
    })

    if (resp.status === 404) {
      throw new Error('NOT_FOUND')
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`JIRA_ERROR: ${resp.status} ${text}`)
    }

  const data: any = await resp.json().catch(() => ({}))

  const fields = data.fields || {}
    const summary = fields.summary || ''

    let description = ''
    if (typeof fields.description === 'string') {
      description = fields.description
    } else if (typeof fields.description === 'object') {
      // Try ADF -> text
      description = this.adfToText(fields.description) || JSON.stringify(fields.description)
    }

    // If customfield_10037 is present, prefer it for acceptance criteria
    let acceptanceCriteria: string | undefined
    const cf = fields.customfield_10037
    if (typeof cf === 'string') {
      acceptanceCriteria = cf
    } else if (typeof cf === 'object' && cf !== null) {
      // Try to convert ADF or similar structures
      const cfText = this.adfToText(cf)
      acceptanceCriteria = cfText || JSON.stringify(cf)
    }

    // Fallback: Heuristic extraction from description
    if (!acceptanceCriteria) {
      acceptanceCriteria = this.extractAcceptanceCriteria(description)
    }

    return { summary, description, acceptanceCriteria }
  }

  private extractAcceptanceCriteria(text: string): string | undefined {
    if (!text || typeof text !== 'string') return undefined

    const lower = text.toLowerCase()
    // Try to find common headings
    const headings = ['acceptance criteria', 'acceptance-criteria', 'acceptance:', 'acceptance criteria:','acceptance criteria -','acceptance criteria\n']
    for (const h of headings) {
      const idx = lower.indexOf(h)
      if (idx >= 0) {
        // Grab following 600 chars or until double newline
        const snippet = text.substring(idx + h.length, idx + h.length + 600)
        // trim leading punctuation/colon/newlines
        const cleaned = snippet.replace(/^[:\s\-\n\r]+/, '').trim()
        // Stop at two newlines (paragraph) if present
        const end = Math.min(cleaned.indexOf('\n\n') > 0 ? cleaned.indexOf('\n\n') : cleaned.length, cleaned.length)
        return cleaned.substring(0, end).trim()
      }
    }

    // Fallback: look for lines starting with "AC:" or "- " and collect contiguous lines
    const lines = text.split(/\r?\n/)
    const acLines: string[] = []
    let collecting = false
    for (const line of lines) {
      const trimmed = line.trim()
      if (!collecting && /^AC[:\-]/i.test(trimmed)) {
        collecting = true
        acLines.push(trimmed.replace(/^AC[:\-]\s*/i, ''))
        continue
      }
      if (!collecting && /^(acceptance criteria|acceptance):?/i.test(trimmed)) {
        collecting = true
        continue
      }
      if (collecting) {
        if (trimmed === '') break
        if (/^[-*]\s+/.test(trimmed)) {
          acLines.push(trimmed.replace(/^[-*]\s+/, ''))
        } else if (/^[A-Z][A-Za-z\s]+:$/.test(trimmed)) {
          // new heading
          break
        } else {
          acLines.push(trimmed)
        }
      }
    }

    if (acLines.length > 0) {
      return acLines.join('\n')
    }

    return undefined
  }
}
