import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [docs, setDocs] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [view, setView] = useState('list')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/data/documents')
      .then(r => r.json())
      .then(d => {
        setDocs(Array.isArray(d) ? d : [])
      })
  }, [])

  const importJson = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.content || !Array.isArray(data.content)) {
          alert('JSON格式错误')
          return
        }
        const newDoc = {
          id: Date.now().toString(),
          title: data.title || file.name.replace('.json', ''),
          content: data.content
        }
        fetch('/api/data/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDoc)
        }).then(() => {
          setDocs(prev => [...prev, newDoc])
          setCurrentDoc(newDoc)
          setView('preview')
        })
      } catch {
        alert('解析失败')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const deleteDoc = (id, e) => {
    e.stopPropagation()
    if (!confirm('删除?')) return
    fetch(`/api/data/documents/${id}`, { method: 'DELETE' })
      .then(() => setDocs(prev => prev.filter(d => d.id !== id)))
  }

  const exportPdf = () => window.print()

  if (view === 'list' || !currentDoc) {
    return (
      <div className="app">
        <header className="header">
          <h1>拼音文档</h1>
          <button className="import-btn" onClick={() => fileInputRef.current.click()}>
            + 导入
          </button>
          <input type="file" ref={fileInputRef} accept=".json" onChange={importJson} hidden />
        </header>

        <main className="doc-list">
          {docs.length === 0 ? (
            <div className="empty">暂无文档，点击右上角导入</div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="doc-card" onClick={() => { setCurrentDoc(doc); setView('preview'); }}>
                <div className="doc-info">
                  <h3>{doc.title}</h3>
                  <span>{doc.content.length}行</span>
                </div>
                <div className="doc-actions">
                  <button onClick={(e) => { e.stopPropagation(); setCurrentDoc(doc); setView('preview'); }}>预览</button>
                  <button className="del" onClick={(e) => deleteDoc(doc.id, e)}>删除</button>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <button className="back-btn" onClick={() => setView('list')}>←</button>
        <h1>{currentDoc.title}</h1>
        <button className="export-btn" onClick={exportPdf}>PDF</button>
      </header>

      <main className="preview-area">
        {currentDoc.content.map((line, i) => (
          <div key={i} className="print-line">
            {line.map(([c, p], j) => (
              <span key={j} className="print-char">
                <span className="py">{p}</span>
                <span className="hz">{c}</span>
              </span>
            ))}
          </div>
        ))}
      </main>
    </div>
  )
}

export default App
