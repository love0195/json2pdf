import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [docs, setDocs] = useState([])
  const [currentDoc, setCurrentDoc] = useState(null)
  const [view, setView] = useState('list')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [pasteJson, setPasteJson] = useState('')
  const [settings, setSettings] = useState({ fontSize: 20, pyFontSize: 12 })
  const fileInputRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/data/documents').then(r => r.json()),
      fetch('/api/data/settings').then(r => r.json())
    ]).then(([docsData, settingsData]) => {
      setDocs(Array.isArray(docsData) ? docsData : [])
      setSettings(settingsData)
    })
  }, [])

  const saveSettings = (newSettings) => {
    setSettings(newSettings)
    fetch('/api/data/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    })
  }

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

  const exportPdf = () => {
    const style = document.createElement('style')
    style.id = 'print-style-temp'
    style.textContent = `
      @media print {
        .py {
          font-size: ${settings.pyFontSize}pt !important;
        }
        .hz {
          font-size: ${settings.fontSize}pt !important;
        }
      }
    `
    document.head.appendChild(style)
    
    window.print()
    
    setTimeout(() => {
      const s = document.getElementById('print-style-temp')
      if (s) s.remove()
    }, 1000)
  }

  if (view === 'list' || !currentDoc) {
    return (
      <div className="app">
        <header className="header">
          <h1>拼音文档</h1>
          <div className="header-actions">
            <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>
              ⚙️
            </button>
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
              <div key={doc.id} className="doc-card">
                <div className="doc-info" onClick={() => { setCurrentDoc(doc); setView('preview'); }}>
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

        {showSettingsModal && (
          <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>打印设置</h2>
              
              <div className="settings-group">
                <label>汉字大小: {settings.fontSize}pt</label>
                <input
                  type="range"
                  min="12"
                  max="36"
                  value={settings.fontSize}
                  onChange={(e) => saveSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="settings-group">
                <label>拼音大小: {settings.pyFontSize}pt</label>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={settings.pyFontSize}
                  onChange={(e) => saveSettings({ ...settings, pyFontSize: parseInt(e.target.value) })}
                />
              </div>
              
              <button className="close-btn" onClick={() => setShowSettingsModal(false)}>关闭</button>
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
        <div className="header-actions">
          <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>⚙️</button>
          <button className="export-btn" onClick={exportPdf}>PDF</button>
        </div>
      </header>

      <main className="preview-area">
        <div className="preview-content">
          {currentDoc.content.map((line, i) => (
            <div key={i} className="print-line">
              {line.map(([c, p], j) => (
                <span key={j} className="print-char">
                  <span className="py" style={{ fontSize: `${settings.pyFontSize}px` }}>{p}</span>
                  <span className="hz" style={{ fontSize: `${settings.fontSize}px` }}>{c}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </main>

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>打印设置</h2>
            
            <div className="settings-group">
              <label>汉字大小: {settings.fontSize}pt</label>
              <input
                type="range"
                min="12"
                max="36"
                value={settings.fontSize}
                onChange={(e) => saveSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="settings-group">
              <label>拼音大小: {settings.pyFontSize}pt</label>
              <input
                type="range"
                min="8"
                max="24"
                value={settings.pyFontSize}
                onChange={(e) => saveSettings({ ...settings, pyFontSize: parseInt(e.target.value) })}
              />
            </div>
            
            <button className="close-btn" onClick={() => setShowSettingsModal(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
