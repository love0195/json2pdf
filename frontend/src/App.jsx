import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fontSize, setFontSize] = useState(28)
  const [activeTab, setActiveTab] = useState('preview')

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

  const exportVectorPdf = () => {
    if (!data) return

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = 210, pageH = 297
    const lineHeight = 15
    let cursorY = 40

    pdf.setFont("SimSun")
    pdf.setFontSize(fontSize - 4)

    data.content.forEach((line) => {
      let totalWidth = 0
      line.forEach(([char]) => totalWidth += pdf.getTextWidth(char))

      let cursorX = (pageW - totalWidth) / 2

      if (cursorY > pageH - 30) {
        pdf.addPage()
        cursorY = 30
      }

      line.forEach(([char, py]) => {
        pdf.setFontSize(fontSize - 8)
        pdf.text(py, cursorX, cursorY - 5)
        pdf.setFontSize(fontSize - 4)
        pdf.text(char, cursorX, cursorY + 5)
        cursorX += pdf.getTextWidth(char)
      })
      cursorY += lineHeight
    })

    pdf.save(`${data.title || 'output'}.pdf`)
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
          <button className="export-btn" onClick={exportVectorPdf}>
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
