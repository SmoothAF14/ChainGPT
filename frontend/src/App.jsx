import { useEffect, useRef, useState } from 'react'

const domainOptions = [
  { id: 'auto', label: 'Auto detect' },
  { id: 'crypto', label: 'Crypto Basics' },
  { id: 'defi', label: 'DeFi Risk' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'trading', label: 'Trading' },
  { id: 'blockchain_dev', label: 'Blockchain Dev' },
]

const suggestions = [
  'Compare Bitcoin and Ethereum in a table',
  'Show me a flow diagram for a wallet transaction',
  'Explain a token unlock schedule with a chart',
  'What is DeFi staking risk in simple terms?',
]

const systemTags = [
  'DOMAIN-RAG ACTIVE',
  'SMART OUTPUTS',
  'CYAN TRACE LINK',
  'TABLES READY',
  'DIAGRAMS READY',
  'CHAINGPT CONSOLE',
]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || ''

function apiUrl(path) {
  return `${API_BASE_URL}${path}`
}

const starterMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'I am BlockBrain. Ask me anything and I will respond with domain-aware answers, tables, and visual diagrams when useful.',
}

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  }
}

function isMarkdownTable(block) {
  const lines = block.trim().split('\n').map((line) => line.trim())
  if (lines.length < 2 || !lines[0].includes('|')) {
    return false
  }

  const separator = lines[1].replace(/\|/g, '').trim()
  return /^:?-{3,}:?(\s+:?-{3,}:?)*$/.test(separator)
}

function parseMarkdownTable(block) {
  const lines = block.trim().split('\n').map((line) => line.trim())
  const headers = lines[0].split('|').map((cell) => cell.trim()).filter(Boolean)
  const rows = lines.slice(2).map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean))
  return { headers, rows }
}

function parseMermaidNode(token) {
  const trimmed = token.trim()
  const match = trimmed.match(/^([A-Za-z0-9_]+)\s*(?:\[(.+)\]|\((.+)\)|\{(.+)\}|"(.+)")?$/)

  if (!match) {
    return {
      id: trimmed,
      label: trimmed,
    }
  }

  const [, id, squareLabel, roundLabel, braceLabel, quoteLabel] = match
  return {
    id,
    label: squareLabel || roundLabel || braceLabel || quoteLabel || id,
  }
}

function parseMermaidDiagram(code) {
  const lines = code
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('%%'))

  if (!lines.length) {
    return null
  }

  let direction = 'TD'
  const firstLine = lines[0].toUpperCase()
  if (firstLine.startsWith('GRAPH ')) {
    const parts = firstLine.split(/\s+/)
    direction = parts[1] || 'TD'
    lines.shift()
  }

  const edges = []
  const nodes = new Map()

  const registerNode = (token) => {
    const node = parseMermaidNode(token)
    if (!nodes.has(node.id)) {
      nodes.set(node.id, node)
    } else if (node.label && node.label !== node.id) {
      nodes.get(node.id).label = node.label
    }
    return nodes.get(node.id)
  }

  lines.forEach((line) => {
    const cleanedLine = line.replace(/;$/, '')
    const chainParts = cleanedLine.split(/\s*--?>\s*/)
    if (chainParts.length < 2) {
      const nodeMatch = cleanedLine.match(/^([A-Za-z0-9_]+)(?:\[(.+)\]|\((.+)\)|\{(.+)\}|"(.+)")?$/)
      if (nodeMatch) {
        registerNode(cleanedLine)
      }
      return
    }

    const chainNodes = chainParts.map((part) => registerNode(part))
    for (let index = 0; index < chainNodes.length - 1; index += 1) {
      edges.push({ from: chainNodes[index].id, to: chainNodes[index + 1].id })
    }
  })

  if (!nodes.size || !edges.length) {
    return null
  }

  const incoming = new Map()
  const outgoing = new Map()
  nodes.forEach((node) => {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
  })

  edges.forEach((edge) => {
    incoming.get(edge.to).push(edge.from)
    outgoing.get(edge.from).push(edge.to)
  })

  const levels = new Map()
  nodes.forEach((node) => levels.set(node.id, 0))

  let changed = true
  let guard = 0
  while (changed && guard < 20) {
    changed = false
    guard += 1
    edges.forEach((edge) => {
      const sourceLevel = levels.get(edge.from) ?? 0
      const nextLevel = sourceLevel + 1
      if ((levels.get(edge.to) ?? 0) < nextLevel) {
        levels.set(edge.to, nextLevel)
        changed = true
      }
    })
  }

  const grouped = new Map()
  nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0
    if (!grouped.has(level)) {
      grouped.set(level, [])
    }
    grouped.get(level).push(node)
  })

  const orderedLevels = [...grouped.keys()].sort((left, right) => left - right)
  const maxWidth = Math.max(...orderedLevels.map((level) => grouped.get(level).length))

  return {
    direction,
    levels: orderedLevels.map((level) => grouped.get(level)),
    nodes,
    edges,
    maxWidth,
  }
}

function renderMermaidDiagram(code, keyPrefix) {
  const diagram = parseMermaidDiagram(code)
  if (!diagram) {
    return (
      <pre className="code-block mermaid-block">
        <code>{code}</code>
      </pre>
    )
  }

  const isLeftToRight = diagram.direction === 'LR' || diagram.direction === 'RL'

  return (
    <div className={`mermaid-diagram ${isLeftToRight ? 'mermaid-horizontal' : 'mermaid-vertical'}`}>
      <div className="mermaid-title">Diagram</div>
      <div className="mermaid-flow">
        {diagram.levels.map((levelNodes, levelIndex) => (
          <div key={`${keyPrefix}-level-${levelIndex}`} className="mermaid-level">
            {levelNodes.map((node, nodeIndex) => (
              <div key={`${keyPrefix}-${node.id}-${nodeIndex}`} className="mermaid-node">
                {node.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mermaid-edge-list">
        {diagram.edges.map((edge, edgeIndex) => {
          const from = diagram.nodes.get(edge.from)
          const to = diagram.nodes.get(edge.to)
          return (
            <div key={`${keyPrefix}-edge-${edgeIndex}`} className="mermaid-edge">
              <span className="mermaid-edge-label">{from?.label || edge.from}</span>
              <span className="mermaid-arrow">→</span>
              <span className="mermaid-edge-label">{to?.label || edge.to}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderAssistantContent(content) {
  const nodes = []
  const segments = content.split(/```/)

  segments.forEach((segment, index) => {
    if (index % 2 === 1) {
      const firstLineBreak = segment.indexOf('\n')
      const language = firstLineBreak === -1 ? segment.trim() : segment.slice(0, firstLineBreak).trim()
      const code = firstLineBreak === -1 ? '' : segment.slice(firstLineBreak + 1)

      if (language === 'mermaid') {
        nodes.push(
          <div key={`mermaid-${index}`} className="diagram-wrap">
            {renderMermaidDiagram(code, `mermaid-${index}`)}
          </div>,
        )
        return
      }

      nodes.push(
        <pre key={`code-${index}`} className={`code-block ${language === 'mermaid' ? 'mermaid-block' : ''}`}>
          <code>{code}</code>
        </pre>,
      )
      return
    }

    const paragraphs = segment
      .split(/\n\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (isMarkdownTable(paragraph)) {
        const { headers, rows } = parseMarkdownTable(paragraph)
        nodes.push(
          <div key={`table-${index}-${paragraphIndex}`} className="table-wrap">
            <table className="markdown-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`${row.join('-')}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${cell}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
        return
      }

      nodes.push(
        <p key={`text-${index}-${paragraphIndex}`} className="message-paragraph">
          {paragraph}
        </p>,
      )
    })
  })

  return nodes
}

export default function App() {
  const [messages, setMessages] = useState([starterMessage])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [domain, setDomain] = useState('auto')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(apiUrl('/api/health'))
        setConnectionStatus(response.ok ? 'connected' : 'offline')
      } catch {
        setConnectionStatus('offline')
      }
    }

    checkBackend()
  }, [])

  const sendMessage = async (text) => {
    const messageText = text.trim()
    if (!messageText || loading) {
      return
    }

    setMessages((current) => [...current, createMessage('user', messageText)])
    setDraft('')
    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText, domain }),
      })

      const rawBody = await response.text()
      let data = {}

      if (rawBody) {
        try {
          data = JSON.parse(rawBody)
        } catch {
          data = { detail: rawBody }
        }
      }

      if (!response.ok) {
        throw new Error(data.detail || data.error || data.message || 'Request failed')
      }

      setMessages((current) => [...current, createMessage('assistant', data.reply)])
    } catch (error) {
      setMessages((current) => [...current, createMessage('assistant', `Error: ${error.message}`)])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    await sendMessage(draft)
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-overlay" />

      <main className="dashboard">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">CG</div>
            <div>
              <div className="brand-name">ChainGPT</div>
              <div className="brand-subtitle">Domain-aware crypto intelligence console</div>
            </div>
          </div>

          <nav className="topnav" aria-label="Primary">
            <span>Protocol</span>
            <span>RAG</span>
            <span>Domains</span>
          </nav>

          <div className="status-panel">
            <div className={`status-dot ${connectionStatus}`} />
            <div>
              <span className="status-label">System</span>
              <strong>
                {connectionStatus === 'connected'
                  ? 'Online'
                  : connectionStatus === 'offline'
                    ? 'Offline'
                    : 'Booting'}
              </strong>
            </div>
          </div>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <div className="eyebrow">OpenRouter • React • Python • RAG</div>
            <h1>Clean, hi-tech answers for the chain economy, rendered like a live protocol console.</h1>
            <p>ChainGPT delivers fast, domain-aware crypto answers with clean structured outputs.</p>
          </div>

          <div className="spec-card">
            <div className="spec-heading">Protocol / Spec</div>
            <div className="spec-row">
              <span>Brand</span>
              <strong>ChainGPT</strong>
            </div>
            <div className="spec-row">
              <span>Output</span>
              <strong>Tables · Diagrams · Charts</strong>
            </div>
            <div className="spec-row">
              <span>Context</span>
              <strong>Domain RAG</strong>
            </div>
            <div className="spec-row">
              <span>Status</span>
              <strong className={connectionStatus === 'connected' ? 'status-good' : 'status-warn'}>
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'offline'
                    ? 'Disconnected'
                    : 'Checking'}
              </strong>
            </div>
          </div>
        </section>

        <section className="signal-strip" aria-label="System status feed">
          {systemTags.map((tag) => (
            <span key={tag} className="signal-chip">
              {tag}
            </span>
          ))}
        </section>

        <section className="content-grid">
          <aside className="sidebar-card">
            <h2>Quick prompts</h2>
            <p className="sidebar-copy">Pick a domain or leave auto detect on. Ask for tables, graphs, or explanations.</p>
            <div className="domain-picker">
              <span className="domain-label">Domain</span>
              <select value={domain} onChange={(event) => setDomain(event.target.value)}>
                {domainOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="suggestions">
              {suggestions.map((item) => (
                <button
                  key={item}
                  className="suggestion-chip"
                  onClick={() => sendMessage(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <section className="chat-card">
            <div className="chat-topbar">
              <div>
                <span className="chat-title">Conversation</span>
                <p>Messages are sent to <span>/api/chat</span> and rendered here with rich structure.</p>
              </div>
              <span className={`live-pill ${loading ? 'active' : ''}`}>
                {loading ? 'Thinking' : 'Ready'}
              </span>
            </div>

            <div className="chat-stream">
              {messages.map((message) => (
                <article key={message.id} className={`bubble ${message.role}`}>
                  <span className="bubble-role">{message.role === 'user' ? 'You' : 'BlockBrain'}</span>
                  {message.role === 'assistant' ? renderAssistantContent(message.content) : <p>{message.content}</p>}
                </article>
              ))}
              <div ref={endRef} />
            </div>

            <form className="composer" onSubmit={onSubmit}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your message..."
                rows={3}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    onSubmit(event)
                  }
                }}
              />
              <div className="composer-actions">
                <span className="hint">Press Enter to send, Shift+Enter for a new line</span>
                <button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  )
}
