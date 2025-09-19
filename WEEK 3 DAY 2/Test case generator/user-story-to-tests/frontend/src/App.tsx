import React, { Fragment, useEffect, useState } from 'react'
import TestDataGenerator from './components/TestDataGenerator'
import { generateTests, fetchJiraIssue } from './api'
import { GenerateRequest, GenerateResponse, TestCase } from './types'

const CATEGORIES = ['Functional', 'Integration', 'E2E', 'Performance', 'Security', 'Boundary']

const initialForm = {
  storyTitle: '',
  acceptanceCriteria: '',
  description: '',
  additionalInfo: '',
  testcaseCount: 5,
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'app' | 'testdata'>('app')

  // form state
  const [formData, setFormData] = useState<typeof initialForm>(initialForm)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // jira helper
  const [jiraId, setJiraId] = useState('')
  const [jiraLoading, setJiraLoading] = useState(false)
  const [jiraError, setJiraError] = useState<string | null>(null)

  // generation state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GenerateResponse | null>(null)

  useEffect(() => {
    // keep testcaseCount within 1..20
    setFormData(prev => ({ ...prev, testcaseCount: Math.max(1, Math.min(20, Number(prev.testcaseCount || 1))) }))
  }, [])

  function handleInputChange(field: keyof typeof initialForm, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleFetchJira() {
    setJiraError(null)
    if (!jiraId || !jiraId.trim()) {
      setJiraError('Please enter a JIRA ID')
      return
    }
    setJiraLoading(true)
    try {
      const issue = await fetchJiraIssue(jiraId.trim())
      setFormData(prev => ({
        ...prev,
        storyTitle: issue.summary || prev.storyTitle,
        description: issue.description || prev.description,
        acceptanceCriteria: typeof issue.acceptanceCriteria !== 'undefined' && issue.acceptanceCriteria !== null ? String(issue.acceptanceCriteria) : prev.acceptanceCriteria,
      }))
    } catch (err) {
      setJiraError(err instanceof Error ? err.message : 'Failed to fetch JIRA issue')
    } finally {
      setJiraLoading(false)
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)

    if (!formData.storyTitle || !formData.acceptanceCriteria) {
      setError('Story Title and Acceptance Criteria are required')
      return
    }

    const request: GenerateRequest = {
      storyTitle: formData.storyTitle,
      acceptanceCriteria: formData.acceptanceCriteria,
      description: formData.description,
      additionalInfo: formData.additionalInfo,
      category: selectedCategories.length ? selectedCategories.join(',') : undefined,
      testcaseCount: Number(formData.testcaseCount || 5),
    }

    setIsLoading(true)
    try {
      const res = await generateTests(request)
      setResults(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f6fffa; color: #333; }
        .container { max-width: 1100px; margin: 0 auto; padding: 24px; }
        .header { text-align: center; margin-bottom: 20px }
        .title { font-size: 2rem; color: #2c3e50 }
        .subtitle { color: #666 }
        .form-container { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-bottom: 20px }
        .form-group { margin-bottom: 16px }
        .form-label { display:block; font-weight:600; margin-bottom:8px }
        .form-input, .form-textarea { width:100%; padding:10px; border:1px solid #e6edf0; border-radius:6px }
        .submit-btn { background:#df171b; color:white; padding:10px 16px; border-radius:6px; border:none; cursor:pointer }
        .category-chip { padding:8px 12px; border-radius:6px; border:1px solid #e6edf0; background:#fff; cursor:pointer }
        .category-chip.selected { background:#2d9cdb; color:white }
        .results-container { margin-top: 12px }
        .results-table { width:100%; border-collapse: collapse }
        .results-table th, .results-table td { text-align:left; padding:8px; border-bottom:1px solid #eee }
      `}</style>

      <div className="container">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => setActiveTab('app')} className={`category-chip ${activeTab === 'app' ? 'selected' : ''}`}>User Story to Tests</button>
          <button type="button" onClick={() => setActiveTab('testdata')} className={`category-chip ${activeTab === 'testdata' ? 'selected' : ''}`}>Test Data Generator</button>
        </div>

        <div className="header">
          <h1 className="title">User Story to Tests</h1>
          <p className="subtitle">Generate comprehensive test cases from your user stories</p>
        </div>

        {activeTab === 'app' ? (
          <div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group" style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">JIRA ID</label>
                  <input className="form-input" value={jiraId} onChange={e => setJiraId(e.target.value)} placeholder="e.g. PROJ-123" />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <button type="button" className="submit-btn" onClick={handleFetchJira} disabled={jiraLoading}>{jiraLoading ? 'Fetching...' : 'Fetch'}</button>
                </div>
              </div>

              {jiraError && <div style={{ background: '#e74c3c', color: 'white', padding: 8, borderRadius: 6 }}>{jiraError}</div>}

              <div className="form-group">
                <label className="form-label">Story Title *</label>
                <input className="form-input" value={formData.storyTitle} onChange={e => handleInputChange('storyTitle', e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Acceptance Criteria *</label>
                <textarea className="form-textarea" value={formData.acceptanceCriteria} onChange={e => handleInputChange('acceptanceCriteria', e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Info</label>
                <textarea className="form-textarea" value={formData.additionalInfo} onChange={e => handleInputChange('additionalInfo', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Test Category</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat)
                    return (
                      <button key={cat} type="button" className={`category-chip ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}>{cat}</button>
                    )
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Test Cases</label>
                <select className="form-input" value={String(formData.testcaseCount ?? 5)} onChange={e => setFormData(prev => ({ ...prev, testcaseCount: Number(e.target.value) }))}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>{isLoading ? 'Generating...' : 'Generate'}</button>
            </form>

            {error && <div style={{ background: '#e74c3c', color: 'white', padding: 10, borderRadius: 6 }}>{error}</div>}

            {results && (
              <div className="results-container">
                <h3>Generated Test Cases ({results.cases.length})</h3>
                <table className="results-table">
                  <thead>
                    <tr><th>ID</th><th>Title</th><th>Category</th><th>Expected</th></tr>
                  </thead>
                  <tbody>
                    {results.cases.map((tc: TestCase) => (
                      <Fragment key={tc.id}>
                        <tr>
                          <td>{tc.id}</td>
                          <td>{tc.title}</td>
                          <td>{tc.category}</td>
                          <td>{tc.expectedResult}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} style={{ background: '#fafafa', fontSize: 13 }}>
                            <strong>Steps:</strong>
                            <ol>
                              {tc.steps.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="form-container">
            <TestDataGenerator />
          </div>
        )}
      </div>
    </div>
  )
}

export default App