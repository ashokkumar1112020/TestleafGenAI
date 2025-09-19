import { useState } from 'react'

type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'email'
  | 'phone'
  | 'date'
  | 'name'
  | 'address'

type FieldRow = {
  id: string
  name: string
  type: FieldType
  error?: string | null
}

const FIELD_TYPE_OPTIONS: FieldType[] = [
  'string',
  'number',
  'integer',
  'decimal',
  'email',
  'phone',
  'date',
  'name',
  'address'
]

// Helpers for realistic data generation
const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Alex', 'Olivia', 'Daniel', 'Sophia']
const lastNames = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin']
const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln']
const cities = ['New York', 'San Francisco', 'London', 'Sydney', 'Toronto', 'Berlin']
const countries = ['USA', 'UK', 'Australia', 'Canada', 'Germany']

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const sample = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const pad = (n: number, len = 2) => String(n).padStart(len, '0')

function generateValue(type: FieldType, name: string, idx: number) {
  switch (type) {
    case 'name': {
      const first = sample(firstNames)
      const last = sample(lastNames)
      return `${first} ${last}`
    }
    case 'email': {
      // make deterministic-ish unique emails using idx
      const local = `${name.replace(/[^a-z0-9]/gi, '.').toLowerCase() || 'user'}`.replace(/\.+/g, '.')
      const domain = 'example.com'
      const suffix = idx + rand(1, 999)
      return `${local}.${suffix}@${domain}`
    }
    case 'phone': {
      // 10-digit
      let num = ''
      for (let i = 0; i < 10; i++) num += String(rand(0, 9))
      return num
    }
    case 'date': {
      const year = rand(1970, 2023)
      const month = pad(rand(1, 12))
      const day = pad(rand(1, 28))
      return `${year}-${month}-${day}`
    }
    case 'address': {
      const num = rand(1, 9999)
      const street = `${sample(streets)} ${rand(1, 999)}`
      const city = sample(cities)
      const country = sample(countries)
      return `${num} ${street}, ${city}, ${country}`
    }
    case 'integer':
    case 'number': {
      return String(rand(1, 10000))
    }
    case 'decimal': {
      const val = (Math.random() * 10000).toFixed(rand(2, 3))
      return val
    }
    case 'string':
    default: {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const len = rand(5, 15)
      let s = ''
      for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length))
      return s
    }
  }
}

function suggestTypesForName(name: string): FieldType[] {
  const n = name.toLowerCase()
  if (!n) return FIELD_TYPE_OPTIONS
  const suggestions: FieldType[] = []
  if (n.includes('phone') || n.includes('tel')) suggestions.push('phone')
  if (n.includes('email') || n.includes('e-mail')) suggestions.push('email')
  if (n.includes('name')) suggestions.push('name')
  if (n.includes('date') || n.includes('dob')) suggestions.push('date')
  if (n.includes('addr') || n.includes('address')) suggestions.push('address')
  if (n.includes('id') || n.includes('count') || n.includes('number')) suggestions.push('integer')
  if (suggestions.length === 0) suggestions.push('string')
  return Array.from(new Set([...suggestions, ...FIELD_TYPE_OPTIONS]))
}

export default function TestDataGenerator() {
  const [rows, setRows] = useState<FieldRow[]>([
    { id: String(Date.now()) + '-0', name: '', type: 'string', error: null }
  ])

  const [generated, setGenerated] = useState<string[][] | null>(null)

  function updateRow(id: string, patch: Partial<FieldRow>) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows(prev => [...prev, { id: String(Date.now()) + '-' + prev.length, name: '', type: 'string' }])
  }

  function removeRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function handleGenerate() {
    // validation
    const validated = rows.map(r => {
      const err = !r.name || !r.name.trim() ? 'Field Name is required' : null
      return { ...r, error: err }
    })
    setRows(validated)
    if (validated.some(v => v.error)) {
      return
    }

    // generate up to 5 rows
    const count = 5
    const tableRows: string[][] = []
    for (let i = 0; i < count; i++) {
      const rowValues = validated.map(v => generateValue(v.type, v.name, i))
      tableRows.push(rowValues)
    }

    setGenerated(tableRows)
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Test Data Generator</h2>

      <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
  {rows.map((row) => (
          <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Field Name</label>
              <input
                value={row.name}
                onChange={e => {
                  updateRow(row.id, { name: e.target.value })
                  // smart suggest first suggestion when user types
                  const suggestions = suggestTypesForName(e.target.value)
                  if (suggestions && suggestions.length > 0) updateRow(row.id, { type: suggestions[0] })
                }}
                className="form-input"
                placeholder="e.g. customerName, phoneNumber"
              />
              {row.error && <div style={{ color: 'red', marginTop: 6 }}>{row.error}</div>}
            </div>

            <div style={{ width: 220 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Field Type</label>
              <select
                value={row.type}
                onChange={e => updateRow(row.id, { type: e.target.value as FieldType })}
                className="form-input"
              >
                {FIELD_TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="button" className="submit-btn" onClick={() => removeRow(row.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" className="submit-btn" onClick={addRow}>Add Another Field</button>
          <button type="button" className="submit-btn" onClick={handleGenerate}>Generate</button>
        </div>
      </div>

      {generated && (
        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto', background: 'white', padding: 12, borderRadius: 8 }}>
            <table className="results-table">
              <thead>
                <tr>
                  {rows.map(r => (
                    <th key={r.id}>{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generated.map((gr, i) => (
                  <tr key={i}>
                    {gr.map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
