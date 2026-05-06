import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fontSize, setFontSize] = useState(28)
  const [activeTab, setActiveTab] = useState('preview')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setIsLoading(false)
      })
  }, [])

  const exportPdf = () => {
    if (!data) return
    window.print()
  }

  const handleImportJson = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    fetch('/api/data/import', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(result => {
      if (result.status === 'success') {
        setData(result.data)
        alert('导入成功！')
      } else {
        alert(result.message || '导入失败')
      }
    })
    .catch(err => {
      console.error('Import error:', err)
      alert('导入失败，请重试')
    })

    event.target.value = ''
  }

  const handleFontSizeChange = (e) => {
    setFontSize(parseInt(e.target.value))
  }

  if (isLoading) {
    return <div className="loading">加载中...</div>
  }

  if (!data) {
    return <div className="error">加载数据失败</div>
  }

  return (
    <div className="app">
      <header className="header">
        <h1>{data.title}</h1>
        <div className="controls">
          <div className="font-size-control">
            <label>字号:</label>
            <input
              type="range"
              min="16"
              max="48"
              value={fontSize}
              onChange={handleFontSizeChange}
            />
            <span>{fontSize}</span>
          </div>
          <button className="export-btn" onClick={exportPdf}>
            PDF
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          预览
        </button>
        <button
          className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          编辑
        </button>
      </div>

      <main className="main-content">
        {activeTab === 'preview' && (
          <div className="preview-container">
            {data.content.map((line, lineIndex) => (
              <div key={lineIndex} className="page">
                <div className="line" style={{ fontSize: `${fontSize}px` }}>
                  {line.map(([char, py], charIndex) => (
                    <span key={charIndex} className="char-wrapper">
                      <ruby>
                        <span className="char">{char}</span>
                        <rt className="pinyin">{py}</rt>
                      </ruby>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="editor-container">
            <div className="import-section">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportJson}
                style={{ display: 'none' }}
              />
              <button className="import-btn" onClick={() => fileInputRef.current.click()}>
                📂 导入JSON文件
              </button>
            </div>

            {data.content.map((line, lineIndex) => (
              <div key={lineIndex} className="editor-line">
                {line.map(([char, py], charIndex) => (
                  <div key={charIndex} className="char-input-group">
                    <input
                      type="text"
                      className="char-input"
                      value={char}
                      maxLength={1}
                    />
                    <input
                      type="text"
                      className="pinyin-input"
                      value={py}
                    />
                  </div>
                ))}
                <button className="add-char-btn">+</button>
                <button className="delete-line-btn" onClick={() => handleDeleteLine(lineIndex)}>
                  删除
                </button>
              </div>
            ))}
            <button className="add-line-btn" onClick={handleAddLine}>
              + 添加新行
            </button>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
          <span className="nav-icon">📖</span>
          <span>预览</span>
        </button>
        <button className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
          <span className="nav-icon">✏️</span>
          <span>编辑</span>
        </button>
      </nav>

      <div className="print-content" style={{ display: 'none' }}>
        {data.content.map((line, lineIndex) => (
          <div key={lineIndex} className="print-page">
            <div className="print-line" style={{ fontSize: `${fontSize}px` }}>
              {line.map(([char, py], charIndex) => (
                <span key={charIndex} className="print-char-wrapper">
                  <span className="print-pinyin">{py}</span>
                  <span className="print-hanzi">{char}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  function handleDeleteLine(index) {
    fetch(`/api/data/content/${index}`, {
      method: 'DELETE'
    }).then(() => {
      setData(prev => ({
        ...prev,
        content: prev.content.filter((_, i) => i !== index)
      }))
    })
  }

  function handleAddLine() {
    const newLine = [['字', 'zì']]
    fetch('/api/data/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newLine })
    }).then(res => res.json()).then(() => {
      setData(prev => ({
        ...prev,
        content: [...prev.content, newLine]
      }))
    })
  }
}

export default App
