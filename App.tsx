import React, { useState, useEffect } from "react"
import SixChunkyCubes from "./SixChunkyCubes"
import ReconstructFileGame from "./ReconstructFileGame"

// ============================================================
// DATA: PRE-TEST QUESTIONS (5 Focused MCQs)
// ============================================================
interface Question {
  id: string
  topic: string
  question: string
  options: { label: string; text: string }[]
  correct: string
  explanation: string
}

const PRE_TEST_QUESTIONS: Question[] = [
  {
    id: "pre-1",
    topic: "P2P Architecture vs Client-Server",
    question: "What is the primary structural advantage of a decentralized Peer-to-Peer network over a traditional Client-Server model?",
    options: [
      { label: "A", text: "Every participating node acts as both a consumer (downloader) and distributor (uploader), allowing aggregate bandwidth to scale organically with demand." },
      { label: "B", text: "A central authoritative server must cryptographically sign and route all payload packets before delivery." },
      { label: "C", text: "P2P networks eliminate the need for TCP/IP protocols by establishing direct microwave communication links." },
      { label: "D", text: "Client-server setups require domain names, whereas P2P networks only allow synchronous text transmissions." }
    ],
    correct: "A",
    explanation: "In P2P, each peer donates upstream capacity to the network. As more peers join to download, aggregate upload capacity increases proportionally, eliminating the central server bandwidth bottleneck."
  },
  {
    id: "pre-2",
    topic: "Swarm Terminology",
    question: "In the BitTorrent protocol, what constitutes a 'Swarm'?",
    options: [
      { label: "A", text: "A distributed denial-of-service attack cluster attempting to flood tracker ports." },
      { label: "B", text: "The entire collective group of peers actively uploading, downloading, and sharing pieces of a specific torrent payload." },
      { label: "C", text: "The physical server farm hosting the BitTorrent foundation's central indexing database." },
      { label: "D", text: "A local area subnet restricted to verified commercial corporate networks." }
    ],
    correct: "B",
    explanation: "A swarm is the dynamic mesh of all connected peers participating in the transfer of a specific infohash payload."
  },
  {
    id: "pre-3",
    topic: "Seeder Functionality",
    question: "What distinguishes a 'Seeder' from other peers in a BitTorrent swarm?",
    options: [
      { label: "A", text: "A seeder is a client that only performs tracker handshakes without requesting or serving any pieces." },
      { label: "B", text: "A seeder possesses a verified 100% complete copy of the file and dedicates its outbound bandwidth solely to uploading." },
      { label: "C", text: "A seeder is the designated copyright holder mandated by protocol law to maintain 24/7 uptime." },
      { label: "D", text: "A seeder is an ISP routing daemon that throttles P2P connections during peak usage hours." }
    ],
    correct: "B",
    explanation: "Once a peer completes downloading and verifies all pieces, it transitions into a seeder, uploading to others without needing to download further data."
  },
  {
    id: "pre-4",
    topic: "Data Verification & Integrity",
    question: "How does BitTorrent guarantee data integrity and guard against corrupt or forged chunks from untrusted peers?",
    options: [
      { label: "A", text: "It relies solely on Layer-4 TCP checksums without application-level file verification." },
      { label: "B", text: "Each received piece is hashed and cross-referenced against the authoritative SHA-1 hash list stored in the .torrent metainfo file." },
      { label: "C", text: "It queries the central tracker server to inspect the source disk sector remotely." },
      { label: "D", text: "Peers hold a consensus majority vote over UDP to decide whether a received chunk looks correct." }
    ],
    correct: "B",
    explanation: "The .torrent metainfo file contains a concatenation of 20-byte SHA-1 digests for every single piece. Discrepancies cause the corrupt piece to be immediately discarded."
  },
  {
    id: "pre-5",
    topic: "Role of the Tracker",
    question: "What is the primary responsibility of a BitTorrent Tracker server?",
    options: [
      { label: "A", text: "To store the complete multi-gigabyte binary payload and stream it directly to leechers." },
      { label: "B", text: "To act as a rendezvous point that maintains a registry of active peer IP addresses and coordinates introductions." },
      { label: "C", text: "To run automated antivirus scans on client hard drives prior to chunk extraction." },
      { label: "D", text: "To encrypt and re-encode multimedia containers into proprietary BitTorrent bitstreams." }
    ],
    correct: "B",
    explanation: "The tracker is purely a matchmaking coordinator: it maintains a list of swarm participants and returns peer contacts. It never hosts or routes the payload file itself."
  }
]

// ============================================================
// DATA: POST-TEST QUESTIONS (5 Evaluative MCQs)
// ============================================================
const POST_TEST_QUESTIONS: Question[] = [
  {
    id: "post-1",
    topic: "Rarest-First Algorithm",
    question: "Why is the 'Rarest-First' piece selection strategy critical for swarm health and resilience?",
    options: [
      { label: "A", text: "It prioritizes downloading the most abundant chunks first to minimize connection latency." },
      { label: "B", text: "It ensures peers request pieces held by the fewest participants, preventing rare chunks from vanishing if seeders leave." },
      { label: "C", text: "It forces all peers to download sequentially from byte 0 to byte N like HTTP progressive media." },
      { label: "D", text: "It allocates scarce pieces only to nodes that submit proof-of-work cryptographic tokens." }
    ],
    correct: "B",
    explanation: "By prioritizing pieces with the lowest availability count in the swarm, rarest-first rapidly multiplies rare pieces and prevents swarm starvation if the seed disconnects."
  },
  {
    id: "post-2",
    topic: "Tit-for-Tat Choking",
    question: "Under the BitTorrent Choking Algorithm (Tit-for-Tat), how does a leecher determine which regular peers to unchoke?",
    options: [
      { label: "A", text: "It unchokes the top 4 interested peers that are currently reciprocating with the highest inbound download speeds." },
      { label: "B", text: "It randomly chooses 4 peers every 10 seconds regardless of their past bandwidth donation." },
      { label: "C", text: "It unchokes peers strictly based on physical geographical proximity calculated from ping times." },
      { label: "D", text: "It unchokes only peers with 0% completion to enforce strict philanthropic fairness." }
    ],
    correct: "A",
    explanation: "Tit-for-Tat incentivizes cooperative uploading: peers award upload bandwidth to the top 4 neighbors that upload fastest to them, penalizing free-riders with choked status."
  },
  {
    id: "post-3",
    topic: "Optimistic Unchoking",
    question: "What problem does 'Optimistic Unchoking' solve within the swarm dynamics?",
    options: [
      { label: "A", text: "It allows newcomers with zero pieces to bootstrap their download, while discovering peers with potentially faster upstream lines." },
      { label: "B", text: "It permanently bans non-responsive leechers from reconnecting to the swarm index." },
      { label: "C", text: "It bypasses firewall NAT table lookups by injecting raw packet frames into kernel memory." },
      { label: "D", text: "It compresses binary payloads using dictionary Huffman encoding prior to socket transmission." }
    ],
    correct: "A",
    explanation: "Every 30 seconds, a peer unchokes 1 random peer regardless of transfer rate. This allows newly joined nodes (who have no pieces to trade) to obtain chunks and start contributing."
  },
  {
    id: "post-4",
    topic: "End-Game Mode",
    question: "What occurs during BitTorrent's 'End-Game Mode' near the finish of a download?",
    options: [
      { label: "A", text: "The tracker disconnects all seeders to save corporate upstream backbone bandwidth." },
      { label: "B", text: "The client broadcasts redundant requests for the few remaining missing blocks to all unchoked peers, ensuring slow peers do not stall completion." },
      { label: "C", text: "The client switches entirely to an HTTP fallback server to download the final 1% of the payload." },
      { label: "D", text: "The client deletes partial pieces to defragment the host filesystem." }
    ],
    correct: "B",
    explanation: "In end-game mode, missing block requests are broadcast to all peers. When any peer delivers the block, cancellation notices are sent to the rest, preventing a slow tail from stalling completion."
  },
  {
    id: "post-5",
    topic: "Distributed Hash Table (DHT)",
    question: "How does the Distributed Hash Table (DHT / Kademlia) extension enable 'trackerless' torrents?",
    options: [
      { label: "A", text: "It converts torrent infohashes into centralized cloud SQL databases maintained by ISPs." },
      { label: "B", text: "It distributes swarm indexing across all participating clients using 160-bit node IDs and XOR distance routing, eliminating reliance on central trackers." },
      { label: "C", text: "It completely conceals IP headers from intermediate routers, providing anonymity without proxies." },
      { label: "D", text: "It eliminates the need for SHA-1 verification hashes by employing probabilistic Merkle trees." }
    ],
    correct: "B",
    explanation: "Kademlia DHT turns each client into an indexing node. Peers look up contacts for an infohash by querying progressively closer nodes in 160-bit XOR distance space without any central tracker."
  }
]

// ============================================================
// SPEEDOMETER / GAUGE COMPONENT
// ============================================================
interface SpeedometerProps {
  score: number | null
  total: number
  label: string
}

function Speedometer({ score, total, label }: SpeedometerProps) {
  const percentage = score !== null ? Math.round((score / total) * 100) : 0
  const isAwaiting = score === null

  // 0-39% NEEDS REVIEW, 40-59% DEVELOPING, 60-79% GOOD, 80-100% STRONG
  let level = "AWAITING SUBMISSION"
  let levelClass = "badge-awaiting"
  let accentColor = "#3A48E0"

  if (!isAwaiting) {
    if (percentage >= 80) {
      level = "STRONG"
      levelClass = "badge-strong"
      accentColor = "#1FB070"
    } else if (percentage >= 60) {
      level = "GOOD"
      levelClass = "badge-good"
      accentColor = "#3A48E0"
    } else if (percentage >= 40) {
      level = "DEVELOPING"
      levelClass = "badge-developing"
      accentColor = "#F0A030"
    } else {
      level = "NEEDS REVIEW"
      levelClass = "badge-review"
      accentColor = "#E03845"
    }
  }

  // Semi-circle arc geometry: radius 120, center (160, 160)
  // Circumference of semi-circle = PI * 120 ≈ 376.99
  const arcLength = 377
  const fillOffset = isAwaiting ? arcLength : arcLength - (arcLength * (percentage / 100))
  const needleAngle = isAwaiting ? -90 : -90 + (percentage / 100) * 180

  return (
    <div className="speedometer-container">
      <div className="gauge-viewport">
        <svg viewBox="0 0 320 200" className="gauge-svg" aria-label={`${label} gauge`}>
          <defs>
            <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3A48E0" />
              <stop offset="50%" stopColor="#D040FF" />
              <stop offset="100%" stopColor="#1FB070" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Background track arc */}
          <path
            d="M 40 160 A 120 120 0 0 1 280 160"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Colored active fill arc */}
          <path
            d="M 40 160 A 120 120 0 0 1 280 160"
            fill="none"
            stroke="url(#gaugeArcGrad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={fillOffset}
            filter="url(#gaugeGlow)"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />

          {/* Scale tick marks */}
          <text x="36" y="186" className="gauge-tick">0%</text>
          <text x="160" y="32" className="gauge-tick center">50%</text>
          <text x="284" y="186" className="gauge-tick end">100%</text>

          {/* Needle */}
          <g
            className="gauge-needle"
            style={{
              transformOrigin: "160px 160px",
              transform: `rotate(${needleAngle}deg)`,
              transition: "transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <line x1="160" y1="160" x2="160" y2="56" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="160" cy="160" r="9" fill="#ffffff" />
            <circle cx="160" cy="160" r="4" fill="#000000" />
          </g>
        </svg>

        {/* Primary Readout Display */}
        <div className="gauge-metric-card">
          <div className="gauge-score-display">
            {isAwaiting ? "--%" : `${percentage}%`}
          </div>
          <div className="gauge-ratio-label">
            {label}: {isAwaiting ? "- / 5" : `${score} / ${total}`}
          </div>
          <div className="gauge-badge-wrap">
            <span className={`gauge-performance-badge ${levelClass}`}>
              {level}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN APPLICATION COMPONENT
// ============================================================
export default function App() {
  const [activeSection, setActiveSection] = useState("home")

  // Pre-test states
  const [preIndex, setPreIndex] = useState(0)
  const [preAnswers, setPreAnswers] = useState<Record<string, string>>({})
  const [preScore, setPreScore] = useState<number | null>(null)
  const [preSubmitted, setPreSubmitted] = useState(false)
  const [preNotice, setPreNotice] = useState("")
  const [showPreReview, setShowPreReview] = useState(false)

  // Post-test states
  const [postIndex, setPostIndex] = useState(0)
  const [postAnswers, setPostAnswers] = useState<Record<string, string>>({})
  const [postScore, setPostScore] = useState<number | null>(null)
  const [postSubmitted, setPostSubmitted] = useState(false)
  const [postNotice, setPostNotice] = useState("")
  const [showPostReview, setShowPostReview] = useState(false)

  // Force scroll to top on refresh / mount
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname)
    }

    const handleBeforeUnload = () => {
      window.scrollTo(0, 0)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Scrollspy & Nav tracking (Exact 7 sections)
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        "home",
        "aim",
        "theory",
        "pre-test",
        "simulation",
        "post-test",
        "conclusion"
      ]
      const scrollPos = window.scrollY + 200

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i])
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i])
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Pre-test Answer Handlers
  const handleSelectPre = (optionLabel: string) => {
    const qId = PRE_TEST_QUESTIONS[preIndex].id
    setPreAnswers((prev) => ({ ...prev, [qId]: optionLabel }))
    setPreNotice("")
  }

  const handleNextPre = () => {
    if (preIndex < PRE_TEST_QUESTIONS.length - 1) {
      setPreIndex(preIndex + 1)
    }
  }

  const handlePrevPre = () => {
    if (preIndex > 0) {
      setPreIndex(preIndex - 1)
    }
  }

  const handleSubmitPre = () => {
    // Validate all 5 questions
    const answeredCount = Object.keys(preAnswers).length
    if (answeredCount < PRE_TEST_QUESTIONS.length) {
      const firstUnanswered = PRE_TEST_QUESTIONS.findIndex((q) => !preAnswers[q.id])
      if (firstUnanswered !== -1) {
        setPreIndex(firstUnanswered)
      }
      setPreNotice(`Please answer all questions before submitting (${answeredCount}/5 answered). Jumped to Question ${firstUnanswered + 1}.`)
      return
    }

    let calculated = 0
    PRE_TEST_QUESTIONS.forEach((q) => {
      if (preAnswers[q.id] === q.correct) {
        calculated += 1
      }
    })

    setPreScore(calculated)
    setPreSubmitted(true)
    setPreNotice("")
  }

  // Post-test Answer Handlers
  const handleSelectPost = (optionLabel: string) => {
    const qId = POST_TEST_QUESTIONS[postIndex].id
    setPostAnswers((prev) => ({ ...prev, [qId]: optionLabel }))
    setPostNotice("")
  }

  const handleNextPost = () => {
    if (postIndex < POST_TEST_QUESTIONS.length - 1) {
      setPostIndex(postIndex + 1)
    }
  }

  const handlePrevPost = () => {
    if (postIndex > 0) {
      setPostIndex(postIndex - 1)
    }
  }

  const handleSubmitPost = () => {
    // Validate all 5 questions
    const answeredCount = Object.keys(postAnswers).length
    if (answeredCount < POST_TEST_QUESTIONS.length) {
      const firstUnanswered = POST_TEST_QUESTIONS.findIndex((q) => !postAnswers[q.id])
      if (firstUnanswered !== -1) {
        setPostIndex(firstUnanswered)
      }
      setPostNotice(`Please answer all questions before submitting (${answeredCount}/5 answered). Jumped to Question ${firstUnanswered + 1}.`)
      return
    }

    let calculated = 0
    POST_TEST_QUESTIONS.forEach((q) => {
      if (postAnswers[q.id] === q.correct) {
        calculated += 1
      }
    })

    setPostScore(calculated)
    setPostSubmitted(true)
    setPostNotice("")
  }

  // Current question references
  const currentPreQ = PRE_TEST_QUESTIONS[preIndex]
  const currentPostQ = POST_TEST_QUESTIONS[postIndex]

  return (
    <div className="lab-root">
      {/* ============================================================
          PERSISTENT TOP NAVIGATION
          Labels: HOME, AIM, THEORY, PRE-TEST, SIMULATION, POST-TEST, CONCLUSION
          ============================================================ */}
      <header className="persistent-nav" role="banner">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => scrollTo("home")}>
            <img src="/logo.png" alt="Somaiya Vidyavihar Logo" className="brand-logo-img" />
            <div className="brand-text-group">
              <span className="brand-title">BITTORRENT</span>
              <span className="brand-sub">PROTOCOL LAB</span>
            </div>
          </div>

          <nav className="nav-links" aria-label="Page Sections">
            <button
              type="button"
              className={`nav-btn ${activeSection === "home" ? "active" : ""}`}
              onClick={() => scrollTo("home")}
            >
              HOME
            </button>
            <button
              type="button"
              className={`nav-btn ${activeSection === "aim" ? "active" : ""}`}
              onClick={() => scrollTo("aim")}
            >
              AIM
            </button>
            <button
              type="button"
              className={`nav-btn ${activeSection === "theory" ? "active" : ""}`}
              onClick={() => scrollTo("theory")}
            >
              THEORY
            </button>
            <button
              type="button"
              className={`nav-btn ${activeSection === "pre-test" ? "active" : ""}`}
              onClick={() => scrollTo("pre-test")}
            >
              PRE-TEST
            </button>
            <button
              type="button"
              className={`nav-btn ${activeSection === "simulation" ? "active" : ""}`}
              onClick={() => scrollTo("simulation")}
            >
              SIMULATION
            </button>
            <button
              type="button"
              className={`nav-btn ${activeSection === "post-test" ? "active" : ""}`}
              onClick={() => scrollTo("post-test")}
            >
              POST-TEST
            </button>
            <button
              type="button"
              className={`nav-btn ${activeSection === "conclusion" ? "active" : ""}`}
              onClick={() => scrollTo("conclusion")}
            >
              CONCLUSION
            </button>
          </nav>
        </div>
      </header>

      {/* ============================================================
          1. LANDING PAGE HERO
          Occupies the main opening viewport using the exact SixChunkyCubes
          ============================================================ */}
      <section className="hero-landing-section" id="home" aria-label="Landing Page Hero">
        <div className="cubes-viewport-wrap">
          {/* Exact SixChunkyCubes Component provided by user */}
          <SixChunkyCubes
            background="#000000"
            speed={50}
            scale={85}
            spread={60}
            tumble={50}
            iridescence={100}
            animation={true}
            style={{ minWidth: "100%", minHeight: "100%", width: "100%", height: "100%" }}
          />
        </div>

        {/* Minimal Technical Typography Overlay */}
        <div className="hero-typography-overlay">
          <div className="hero-meta-kicker">ENGINEERING LABORATORY · 6-NODE SWARM</div>
          <h1 className="hero-main-title">BITTORRENT PROTOCOL</h1>
          <p className="hero-secondary-line">PEER-TO-PEER DATA SHARING</p>
          <div className="hero-scroll-indicator" onClick={() => scrollTo("aim")}>
            <span className="scroll-arrow">↓</span>
            <span className="scroll-hint-text">EXPLORE PROTOCOL SPECIFICATION</span>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. AIM SECTION
          Exact statement: "To understand P2P and BitTorrent protocol"
          ============================================================ */}
      <section className="lab-section section-aim" id="aim" aria-labelledby="aim-heading">
        <div className="section-container aim-inner">
          <span className="section-eyebrow">OBJECTIVE</span>
          <h2 className="aim-heading-label" id="aim-heading">AIM</h2>
          <div className="aim-statement-card">
            <p className="aim-main-statement">
              To understand P2P and BitTorrent protocol
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. THEORY SECTION
          Authoritative technical content formatted in clean editorial layout
          ============================================================ */}
      <section className="lab-section section-theory" id="theory" aria-labelledby="theory-heading">
        <div className="section-container">
          <div className="theory-header-block">
            <span className="section-eyebrow">FOUNDATIONAL ARCHITECTURE</span>
            <h2 className="section-primary-heading" id="theory-heading">THEORY</h2>
            <p className="section-subtitle">
              Comprehensive analysis of decentralized swarms, cryptographic verification, and game-theoretic reciprocity.
            </p>
          </div>

          <div className="theory-editorial-grid">
            {/* Subsection 1 */}
            <article className="theory-editorial-card">
              <div className="card-number-tag">01 · ARCHITECTURE</div>
              <h3 className="theory-card-heading">Centralized Client-Server vs. Decentralized P2P</h3>
              <p>
                In a traditional <strong>Client-Server architecture</strong>, the entire distribution burden falls on a central server. As concurrent download requests multiply, the server’s outbound pipe saturates, creating a severe throughput bottleneck and an absolute single point of failure.
              </p>
              <p>
                In contrast, <strong>Peer-to-Peer (P2P) networking</strong> democratizes bandwidth distribution: each participant acts simultaneously as a consumer and a distributor. Every connected peer contributes its local upload bandwidth to neighbors. Aggregate system capacity scales organically as the swarm expands: total transfer capacity equals the sum of all peer upload capacities.
              </p>
            </article>

            {/* Subsection 2 */}
            <article className="theory-editorial-card">
              <div className="card-number-tag">02 · SWARM ROLES</div>
              <h3 className="theory-card-heading">The Swarm Ecosystem: Seeders & Leechers</h3>
              <p>
                A BitTorrent transfer takes place within an isolated overlay network known as a <strong>Swarm</strong>. A swarm comprises all nodes actively communicating for a single target infohash payload.
              </p>
              <ul className="theory-bullet-list">
                <li>
                  <strong>Seeder:</strong> A peer possessing a verified, complete 100% copy of the file payload. Seeders only contribute outbound upload bandwidth and request zero data blocks.
                </li>
                <li>
                  <strong>Leecher:</strong> A peer actively assembling missing pieces of the payload. While downloading, leechers simultaneously upload completed pieces to other peers in the swarm.
                </li>
                <li>
                  <strong>Swarm Availability:</strong> Represents the distributed coverage of pieces across all connected peers. If every distinct piece exists on at least one peer, the swarm can reach full 100% completion even if the original seeder disconnects.
                </li>
              </ul>
            </article>

            {/* Subsection 3 */}
            <article className="theory-editorial-card">
              <div className="card-number-tag">03 · DATA INTEGRITY</div>
              <h3 className="theory-card-heading">Metainfo Files (.torrent), Infohashes & SHA-1</h3>
              <p>
                A transfer begins with a metadata descriptor—either a bencoded <code>.torrent</code> file or a <code>magnet:</code> URI. The metainfo file defines:
              </p>
              <div className="table-wrapper">
                <table className="theory-spec-table">
                  <thead>
                    <tr>
                      <th>Descriptor Field</th>
                      <th>Format</th>
                      <th>Function</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>announce</code></td>
                      <td>URI String</td>
                      <td>Tracker address responsible for coordinating peer discovery.</td>
                    </tr>
                    <tr>
                      <td><code>piece length</code></td>
                      <td>Integer</td>
                      <td>Uniform size of each slice (typically 256 KB to 4 MB).</td>
                    </tr>
                    <tr>
                      <td><code>pieces</code></td>
                      <td>Byte Array</td>
                      <td>Concatenated 20-byte SHA-1 cryptographic hashes of all pieces.</td>
                    </tr>
                    <tr>
                      <td><code>info hash</code></td>
                      <td>20-Byte Digest</td>
                      <td>Authoritative SHA-1 identifier computed from the bencoded <code>info</code> dict.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Because every chunk received from untrusted peers is immediately validated against the authoritative SHA-1 digest, corrupted or maliciously altered blocks are detected instantly and purged.
              </p>
            </article>

            {/* Subsection 4 */}
            <article className="theory-editorial-card">
              <div className="card-number-tag">04 · PEER DISCOVERY</div>
              <h3 className="theory-card-heading">Centralized Trackers vs. Distributed Hash Table (DHT)</h3>
              <p>
                To exchange data, a client must discover the IP addresses and listening port numbers of active swarm participants:
              </p>
              <div className="theory-columns-two">
                <div className="theory-col">
                  <h4>Centralized Tracker Services</h4>
                  <p>
                    A centralized HTTP/UDP tracker maintains a live registry of active peers per infohash. Peers announce status periodically (downloaded, uploaded, remaining) and receive a list of 30–50 random peers. The tracker never handles payload data.
                  </p>
                </div>
                <div className="theory-col">
                  <h4>Distributed Hash Table (DHT / Kademlia)</h4>
                  <p>
                    Modern clients operate trackerless using Kademlia DHT. Nodes are assigned 160-bit IDs and route peer queries across an overlay tree ordered by XOR distance metrics, making swarms immune to centralized server takedowns.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. PRE-TEST SECTION
          Pop-out focused assessment: 1 question at a time, smooth transition
          ============================================================ */}
      <section className="lab-section section-assessment" id="pre-test" aria-labelledby="pretest-heading">
        <div className="section-container">
          <div className="assessment-header">
            <span className="section-eyebrow">DIAGNOSTIC STAGE</span>
            <h2 className="section-primary-heading" id="pretest-heading">PRE-TEST</h2>
            <p className="section-subtitle">
              Test your initial understanding of decentralized architectures, swarms, and data verification.
            </p>
          </div>

          <div className="popout-quiz-wrapper">
            {preSubmitted ? (
              <div className="popout-completed-card" key="pre-completed">
                <div className="popout-completed-header">
                  <span className="popout-kicker">PRE-TEST COMPLETED · RESULT TELEMETRY</span>
                  <h3 className="popout-completed-title">Your Pre-Test Score & Telemetry</h3>
                </div>

                <div className="popout-speedometer-box">
                  <Speedometer score={preScore} total={5} label="PRE-TEST SCORE" />
                </div>

                <div className="popout-score-narrative">
                  <p>
                    Diagnostic recorded: <strong>{preScore} of 5 correct</strong> ({Math.round(((preScore ?? 0) / 5) * 100)}%).
                    {preScore && preScore >= 4 ? " Strong baseline intuition!" : preScore && preScore >= 3 ? " Good foundation!" : " Review theory sections to master protocol mechanics."}
                  </p>
                </div>

                {/* Inline Review Section */}
                <div className="popout-inline-review">
                  <button
                    type="button"
                    className="toggle-review-btn"
                    onClick={() => setShowPreReview(!showPreReview)}
                  >
                    {showPreReview ? "HIDE QUESTION REVIEW ▲" : "REVIEW YOUR ANSWERS (5/5) ▼"}
                  </button>

                  {showPreReview && (
                    <div className="modal-breakdown-scroll">
                      {PRE_TEST_QUESTIONS.map((q, idx) => {
                        const userChoice = preAnswers[q.id]
                        const isCorrect = userChoice === q.correct
                        return (
                          <div key={q.id} className={`modal-breakdown-item ${isCorrect ? "correct" : "incorrect"}`}>
                            <div className="item-meta">
                              <span className="item-qnum">QUESTION {idx + 1} · {q.topic}</span>
                              <span className={`item-status-badge ${isCorrect ? "correct" : "incorrect"}`}>
                                {isCorrect ? "✓ CORRECT" : "✗ INCORRECT"}
                              </span>
                            </div>
                            <div className="item-qtext">{q.question}</div>
                            <div className="item-user-ans">
                              <strong>Your Answer:</strong> {userChoice ? `Option ${userChoice}` : "Unanswered"}
                            </div>
                            {!isCorrect && (
                              <div className="item-correct-ans">
                                <strong>Correct Answer:</strong> Option {q.correct}
                              </div>
                            )}
                            <div className="item-explanation">
                              <strong>Analysis:</strong> {q.explanation}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="popout-actions-bar" style={{ marginTop: "24px" }}>
                  <button
                    type="button"
                    className="quiz-nav-btn"
                    onClick={() => {
                      setPreSubmitted(false)
                      setPreIndex(0)
                    }}
                  >
                    ↺ RETAKE PRE-TEST
                  </button>
                  <button
                    type="button"
                    className="quiz-submit-btn"
                    onClick={() => scrollTo("simulation")}
                  >
                    CONTINUE TO SIMULATION →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Step & Progress Bar */}
                <div className="quiz-progress-bar-wrap">
                  <div className="quiz-progress-meta">
                    <span className="quiz-progress-badge">QUESTION {preIndex + 1} OF 5</span>
                    <span className="quiz-topic-badge">{currentPreQ.topic}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${((preIndex + 1) / PRE_TEST_QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="quiz-pills-row">
                    {PRE_TEST_QUESTIONS.map((q, idx) => {
                      const isAnswered = !!preAnswers[q.id]
                      const isActive = idx === preIndex
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className={`quiz-pill-step ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                          onClick={() => setPreIndex(idx)}
                          title={`Question ${idx + 1}: ${isAnswered ? "Answered (Option " + preAnswers[q.id] + ")" : "Not answered"}`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Focused Question Card */}
                <div className="popout-card" key={`pre-q-${preIndex}`}>
                  <h3 className="popout-question-title">{currentPreQ.question}</h3>

                  <div className="popout-options-list" role="radiogroup" aria-label={currentPreQ.question}>
                    {currentPreQ.options.map((opt) => {
                      const isSelected = preAnswers[currentPreQ.id] === opt.label
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`popout-option-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectPre(opt.label)}
                        >
                          <span className="opt-marker">{opt.label}</span>
                          <span className="opt-text">{opt.text}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Navigation Controls */}
                  <div className="popout-actions-bar">
                    <button
                      type="button"
                      className="quiz-nav-btn"
                      onClick={handlePrevPre}
                      disabled={preIndex === 0}
                    >
                      ← PREVIOUS
                    </button>

                    <div className="popout-center-status">
                      {preNotice && <span className="quiz-error-text">{preNotice}</span>}
                    </div>

                    {preIndex < PRE_TEST_QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        className="quiz-nav-btn next-btn"
                        onClick={handleNextPre}
                      >
                        NEXT →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="quiz-submit-btn"
                        onClick={handleSubmitPre}
                      >
                        SUBMIT PRE-TEST
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. SIMULATION SECTION: RECONSTRUCT THE FILE
          ============================================================ */}
      <ReconstructFileGame onContinueToPostTest={() => scrollTo("post-test")} />

      {/* ============================================================
          6. POST-TEST SECTION
          Focused pop-out interaction: 1 question at a time
          ============================================================ */}
      <section className="lab-section section-assessment" id="post-test" aria-labelledby="posttest-heading">
        <div className="section-container">
          <div className="assessment-header">
            <span className="section-eyebrow">FINAL EVALUATION</span>
            <h2 className="section-primary-heading" id="posttest-heading">POST-TEST</h2>
            <p className="section-subtitle">
              Examine your mastery of rarest-first scheduling, Tit-for-Tat incentives, and DHT peer discovery.
            </p>
          </div>

          <div className="popout-quiz-wrapper">
            {postSubmitted ? (
              <div className="popout-completed-card" key="post-completed">
                <div className="popout-completed-header">
                  <span className="popout-kicker">POST-TEST COMPLETED · MASTERY TELEMETRY</span>
                  <h3 className="popout-completed-title">Your Post-Test Score & Telemetry</h3>
                </div>

                <div className="popout-speedometer-box">
                  <Speedometer score={postScore} total={5} label="POST-TEST SCORE" />
                </div>

                {/* Understated Comparison */}
                <div className="understated-comparison-strip" style={{ margin: "16px auto 20px" }}>
                  <div className="comp-item">
                    <span className="comp-item-label">PRE-TEST</span>
                    <span className="comp-item-value">{preScore !== null ? `${Math.round((preScore / 5) * 100)}%` : "--%"}</span>
                  </div>
                  <div className="comp-sep">/</div>
                  <div className="comp-item">
                    <span className="comp-item-label">POST-TEST</span>
                    <span className="comp-item-value">{postScore !== null ? `${Math.round((postScore / 5) * 100)}%` : "--%"}</span>
                  </div>
                  {postScore !== null && preScore !== null && (
                    <>
                      <div className="comp-sep">/</div>
                      <div className="comp-item">
                        <span className="comp-item-label">DELTA GAIN</span>
                        <span className="comp-item-delta">
                          {Math.round((postScore / 5) * 100) - Math.round((preScore / 5) * 100) >= 0 ? "+" : ""}
                          {Math.round((postScore / 5) * 100) - Math.round((preScore / 5) * 100)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Inline Review Section */}
                <div className="popout-inline-review">
                  <button
                    type="button"
                    className="toggle-review-btn"
                    onClick={() => setShowPostReview(!showPostReview)}
                  >
                    {showPostReview ? "HIDE QUESTION REVIEW ▲" : "REVIEW YOUR ANSWERS (5/5) ▼"}
                  </button>

                  {showPostReview && (
                    <div className="modal-breakdown-scroll">
                      {POST_TEST_QUESTIONS.map((q, idx) => {
                        const userChoice = postAnswers[q.id]
                        const isCorrect = userChoice === q.correct
                        return (
                          <div key={q.id} className={`modal-breakdown-item ${isCorrect ? "correct" : "incorrect"}`}>
                            <div className="item-meta">
                              <span className="item-qnum">QUESTION {idx + 1} · {q.topic}</span>
                              <span className={`item-status-badge ${isCorrect ? "correct" : "incorrect"}`}>
                                {isCorrect ? "✓ CORRECT" : "✗ INCORRECT"}
                              </span>
                            </div>
                            <div className="item-qtext">{q.question}</div>
                            <div className="item-user-ans">
                              <strong>Your Answer:</strong> {userChoice ? `Option ${userChoice}` : "Unanswered"}
                            </div>
                            {!isCorrect && (
                              <div className="item-correct-ans">
                                <strong>Correct Answer:</strong> Option {q.correct}
                              </div>
                            )}
                            <div className="item-explanation">
                              <strong>Analysis:</strong> {q.explanation}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="popout-actions-bar" style={{ marginTop: "24px" }}>
                  <button
                    type="button"
                    className="quiz-nav-btn"
                    onClick={() => {
                      setPostSubmitted(false)
                      setPostIndex(0)
                    }}
                  >
                    ↺ RETAKE POST-TEST
                  </button>
                  <button
                    type="button"
                    className="quiz-submit-btn"
                    onClick={() => scrollTo("conclusion")}
                  >
                    CONTINUE TO CONCLUSION →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Step & Progress Bar */}
                <div className="quiz-progress-bar-wrap">
                  <div className="quiz-progress-meta">
                    <span className="quiz-progress-badge">QUESTION {postIndex + 1} OF 5</span>
                    <span className="quiz-topic-badge">{currentPostQ.topic}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${((postIndex + 1) / POST_TEST_QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="quiz-pills-row">
                    {POST_TEST_QUESTIONS.map((q, idx) => {
                      const isAnswered = !!postAnswers[q.id]
                      const isActive = idx === postIndex
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className={`quiz-pill-step ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                          onClick={() => setPostIndex(idx)}
                          title={`Question ${idx + 1}: ${isAnswered ? "Answered (Option " + postAnswers[q.id] + ")" : "Not answered"}`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Focused Question Card */}
                <div className="popout-card" key={`post-q-${postIndex}`}>
                  <h3 className="popout-question-title">{currentPostQ.question}</h3>

                  <div className="popout-options-list" role="radiogroup" aria-label={currentPostQ.question}>
                    {currentPostQ.options.map((opt) => {
                      const isSelected = postAnswers[currentPostQ.id] === opt.label
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`popout-option-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectPost(opt.label)}
                        >
                          <span className="opt-marker">{opt.label}</span>
                          <span className="opt-text">{opt.text}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Navigation Controls */}
                  <div className="popout-actions-bar">
                    <button
                      type="button"
                      className="quiz-nav-btn"
                      onClick={handlePrevPost}
                      disabled={postIndex === 0}
                    >
                      ← PREVIOUS
                    </button>

                    <div className="popout-center-status">
                      {postNotice && <span className="quiz-error-text">{postNotice}</span>}
                    </div>

                    {postIndex < POST_TEST_QUESTIONS.length - 1 ? (
                      <button
                        type="button"
                        className="quiz-nav-btn next-btn"
                        onClick={handleNextPost}
                      >
                        NEXT →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="quiz-submit-btn"
                        onClick={handleSubmitPost}
                      >
                        SUBMIT POST-TEST
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          7. CONCLUSION SECTION
          Concise 1-2 line academic summary
          ============================================================ */}
      <section className="lab-section section-conclusion" id="conclusion" aria-labelledby="conclusion-heading">
        <div className="section-container conclusion-inner">
          <span className="section-eyebrow">FINAL TAKEAWAY</span>
          <h2 className="section-primary-heading" id="conclusion-heading">CONCLUSION</h2>
          <div className="conclusion-statement-box">
            <blockquote className="conclusion-academic-quote">
              The BitTorrent protocol demonstrates that decentralized peer-to-peer architectures achieve superior scalability and fault tolerance by transforming downloading consumers into reciprocal uploaders through game-theoretic Tit-for-Tat incentives.
            </blockquote>
          </div>

          {/* Student Author Information Card */}
          <div className="author-credentials-card">
            <div className="author-logo-wrap">
              <img src="/logo.png" alt="Somaiya Vidyavihar" className="author-somaiya-logo" />
            </div>
            <div className="author-text-meta">
              <span className="author-kicker">STUDENT RESEARCHER</span>
              <h3 className="author-name">Aaradhya Prabhawalkar</h3>
              <p className="author-roll">Roll Number: <span className="mono-roll">16010425086</span></p>
            </div>
          </div>

          <button type="button" className="return-hero-btn" onClick={() => scrollTo("home")}>
            RETURN TO SWARM HERO ↑
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="lab-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img src="/logo.png" alt="Somaiya Vidyavihar" className="footer-logo-img" />
            <span>BITTORRENT PROTOCOL · PEER-TO-PEER INTERACTIVE LABORATORY</span>
          </div>
          <div className="footer-right">
            <span>Aaradhya Prabhawalkar · Roll No: 16010425086</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
