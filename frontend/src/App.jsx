import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [docs, setDocs] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [view, setView] = useState('list')
  const [showImportModal, setShowImportModal] = useState(false)
  const [pasteJson, setPasteJson] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/data/documents')
      .then(r => r.json())
      .then(d => {
        setDocs(Array.isArray(d) ? d : [])
      })
  }, [])

  const importFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        addDoc(data, file.name.replace('.json', ''))
      } catch {
        alert('JSON格式错误')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const importPaste = () => {
    if (!pasteJson.trim()) {
      alert('请输入JSON内容')
      return
    }
    try {
      const data = JSON.parse(pasteJson)
      addDoc(data, '粘贴文档')
      setPasteJson('')
      setShowImportModal(false)
    } catch {
      alert('JSON格式错误')
    }
  }

  const addDoc = (data, defaultTitle) => {
    if (!data.content || !Array.isArray(data.content)) {
      alert('JSON格式错误，需要包含content数组')
      return
    }
    const newDoc = {
      id: Date.now().toString(),
      title: data.title || defaultTitle,
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
          <div className="header-actions">
            <button className="import-btn" onClick={() => setShowImportModal(true)}>
              + 导入
            </button>
          </div>
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

        {showImportModal && (
          <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>导入文档</h2>
              
              <div className="import-options">
                <button className="option-btn" onClick={() => fileInputRef.current.click()}>
                  📁 上传JSON文件
                </button>
                <input type="file" ref={fileInputRef} accept=".json" onChange={importFile} hidden />
                
                <div className="divider">或</div>
                
                <textarea
                  className="paste-input"
                  placeholder="粘贴JSON内容..."
                  value={pasteJson}
                  onChange={(e) => setPasteJson(e.target.value)}
                  rows={10}
                />
                <button className="paste-btn" onClick={importPaste}>
                  确认导入
                </button>
              </div>
              
              <button className="close-btn" onClick={() => setShowImportModal(false)}>关闭</button>
            </div>
          </div>
        )}
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
        <div className="preview-content">
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
        </div>
      </main>
    </div>
  )
}

export default App
