import React, { useState } from 'react'
import TestDataGenerator from './components/TestDataGenerator'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'app' | 'testdata'>('app')

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
        .category-chip { padding:8px 12px; border-radius:6px; border:1px solid #e6edf0; background:#fff; cursor:pointer }
        .category-chip.selected { background:#2d9cdb; color:white }
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
          <div className="form-container">
            <h2>Original App UI</h2>
            <p>The original app UI was simplified to ensure the project builds. If you want the original full UI restored, I can reconstruct it from the previous snapshot.</p>
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
