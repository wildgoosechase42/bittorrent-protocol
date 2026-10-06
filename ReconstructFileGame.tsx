import React, { useState, useRef, useEffect, useCallback } from "react"

// ============================================================
// DATA DEFINITION: 8 PIECES DISTRIBUTED ACROSS 3 PEERS
// ============================================================
interface Piece {
  id: string
  targetIndex: number
  peerId: string
}

interface Peer {
  id: string
  label: string
  pieces: string[] // initial piece IDs
}

const INITIAL_PEERS: Peer[] = [
  { id: "peer-1", label: "PEER 01", pieces: ["03", "07", "01"] },
  { id: "peer-2", label: "PEER 02", pieces: ["05", "02", "08"] },
  { id: "peer-3", label: "PEER 03", pieces: ["04", "06"] }
]

const ALL_PIECES: Piece[] = [
  { id: "01", targetIndex: 0, peerId: "peer-1" },
  { id: "02", targetIndex: 1, peerId: "peer-2" },
  { id: "03", targetIndex: 2, peerId: "peer-1" },
  { id: "04", targetIndex: 3, peerId: "peer-3" },
  { id: "05", targetIndex: 4, peerId: "peer-2" },
  { id: "06", targetIndex: 5, peerId: "peer-3" },
  { id: "07", targetIndex: 6, peerId: "peer-1" },
  { id: "08", targetIndex: 7, peerId: "peer-2" }
]

interface TransferPacket {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  pieceId: string
}

interface ReconstructFileGameProps {
  onContinueToPostTest?: () => void
}

export default function ReconstructFileGame({ onContinueToPostTest }: ReconstructFileGameProps) {
  // Slots in file assembly: 8 positions (0..7)
  const [slots, setSlots] = useState<(string | null)[]>(Array(8).fill(null))
  // Unplaced pieces per peer
  const [peerPieces, setPeerPieces] = useState<Record<string, string[]>>({
    "peer-1": ["03", "07", "01"],
    "peer-2": ["05", "02", "08"],
    "peer-3": ["04", "06"]
  })

  // Dragging state
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null)
  const [originPeer, setOriginPeer] = useState<string | null>(null)
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null) // tap-to-select fallback

  // Subtle error feedback
  const [shakingPiece, setShakingPiece] = useState<string | null>(null)

  // Subtle packet animation
  const [activePackets, setActivePackets] = useState<TransferPacket[]>([])

  // DOM Refs to track geometry for packet animations and drop hit testing
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const peerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)

  const placedCount = slots.filter(Boolean).length
  const isComplete = placedCount === 8

  // Helper to get piece metadata
  const getPieceMeta = (pieceId: string) => ALL_PIECES.find((p) => p.id === pieceId)

  // Start dragging
  const handlePointerDown = (e: React.PointerEvent, pieceId: string, peerId: string) => {
    // Left mouse click or touch only
    if (e.button !== 0 && e.pointerType === "mouse") return
    e.preventDefault()

    setDraggingPiece(pieceId)
    setOriginPeer(peerId)
    setSelectedPiece(pieceId)
    setPointerPos({ x: e.clientX, y: e.clientY })
  }

  // Pointer move & hit-testing
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingPiece) return
      setPointerPos({ x: e.clientX, y: e.clientY })

      // Hit-test slots
      let foundSlot: number | null = null
      for (let i = 0; i < slotRefs.current.length; i++) {
        const el = slotRefs.current[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          foundSlot = i
          break
        }
      }
      setHoveredSlotIndex(foundSlot)
    },
    [draggingPiece]
  )

  // Commit a piece placement
  const commitPlacement = useCallback(
    (pieceId: string, targetIdx: number, sourcePeerId: string) => {
      const meta = getPieceMeta(pieceId)
      if (!meta) return

      // Must match exact target index (01 -> 0, 02 -> 1, ..., 08 -> 7)
      if (meta.targetIndex === targetIdx && slots[targetIdx] === null) {
        // Success: update slots
        setSlots((prev) => {
          const updated = [...prev]
          updated[targetIdx] = pieceId
          return updated
        })

        // Remove from peer
        setPeerPieces((prev) => ({
          ...prev,
          [sourcePeerId]: prev[sourcePeerId].filter((id) => id !== pieceId)
        }))

        setSelectedPiece(null)

        // Trigger subtle transfer packet animation from peer to file slot
        const peerEl = peerRefs.current[sourcePeerId]
        const slotEl = slotRefs.current[targetIdx]
        const containerEl = containerRef.current

        if (peerEl && slotEl && containerEl) {
          const cRect = containerEl.getBoundingClientRect()
          const pRect = peerEl.getBoundingClientRect()
          const sRect = slotEl.getBoundingClientRect()

          const packet: TransferPacket = {
            id: Date.now() + Math.random(),
            startX: pRect.left + pRect.width / 2 - cRect.left,
            startY: pRect.top + pRect.height / 2 - cRect.top,
            endX: sRect.left + sRect.width / 2 - cRect.left,
            endY: sRect.top + sRect.height / 2 - cRect.top,
            pieceId
          }

          setActivePackets((prev) => [...prev, packet])
          setTimeout(() => {
            setActivePackets((prev) => prev.filter((p) => p.id !== packet.id))
          }, 450)
        }
      } else {
        // Incorrect destination: subtle shake and return
        setShakingPiece(pieceId)
        setTimeout(() => setShakingPiece(null), 400)
      }
    },
    [slots]
  )

  // Pointer release
  const handlePointerUp = useCallback(() => {
    if (!draggingPiece || !originPeer) {
      setDraggingPiece(null)
      setHoveredSlotIndex(null)
      return
    }

    if (hoveredSlotIndex !== null) {
      commitPlacement(draggingPiece, hoveredSlotIndex, originPeer)
    } else {
      // Released outside: subtle return
      setShakingPiece(draggingPiece)
      setTimeout(() => setShakingPiece(null), 300)
    }

    setDraggingPiece(null)
    setOriginPeer(null)
    setHoveredSlotIndex(null)
  }, [draggingPiece, originPeer, hoveredSlotIndex, commitPlacement])

  // Attach global pointer listeners when dragging
  useEffect(() => {
    if (draggingPiece) {
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("pointercancel", handlePointerUp)
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [draggingPiece, handlePointerMove, handlePointerUp])

  // Click-to-slot fallback for touch / accessibility
  const handleSlotClick = (slotIdx: number) => {
    if (!selectedPiece) return
    const meta = getPieceMeta(selectedPiece)
    if (!meta) return

    // Find which peer holds this selected piece
    let sourcePeer = ""
    for (const [peerId, piecesList] of Object.entries(peerPieces)) {
      if (piecesList.includes(selectedPiece)) {
        sourcePeer = peerId
        break
      }
    }
    if (sourcePeer) {
      commitPlacement(selectedPiece, slotIdx, sourcePeer)
    }
  }

  // Reset simulation
  const handleReset = () => {
    setSlots(Array(8).fill(null))
    setPeerPieces({
      "peer-1": ["03", "07", "01"],
      "peer-2": ["05", "02", "08"],
      "peer-3": ["04", "06"]
    })
    setDraggingPiece(null)
    setSelectedPiece(null)
    setHoveredSlotIndex(null)
    setActivePackets([])
  }

  return (
    <section className="lab-section section-game" id="simulation" aria-labelledby="game-heading">
      <div className="section-container">
        {/* Game Area Wrapper */}
        <div className="sim-game-wrapper" ref={containerRef}>
          {/* Top Header: Essential minimal text */}
          <div className="sim-game-header">
            <h2 className="sim-game-title" id="game-heading">RECONSTRUCT THE FILE</h2>
            <p className="sim-instruction-text">Arrange the pieces in the correct order to reconstruct the file.</p>
            <div className="sim-counter-pill">
              <span className="sim-counter-value">{placedCount} / 8 PIECES</span>
            </div>
          </div>

          {/* Transfer Packet Visual Animations (PEER → FILE) */}
          <div className="sim-packet-overlay" aria-hidden="true">
            {activePackets.map((pkt) => (
              <span
                key={pkt.id}
                className="sim-packet-pulse"
                style={
                  {
                    "--start-x": `${pkt.startX}px`,
                    "--start-y": `${pkt.startY}px`,
                    "--end-x": `${pkt.endX}px`,
                    "--end-y": `${pkt.endY}px`
                  } as React.CSSProperties
                }
              >
                {pkt.pieceId}
              </span>
            ))}
          </div>

          {/* File Assembly Stage */}
          <div className={`sim-assembly-card ${isComplete ? "completed" : ""}`}>
            <div className="sim-assembly-label-row">
              <span className="sim-assembly-tag">FILE ASSEMBLY AREA</span>
              {isComplete && <span className="sim-complete-tag">FILE COMPLETE</span>}
            </div>

            {/* Slots Track: [ ? ] [ ? ] [ ? ] [ ? ] [ ? ] [ ? ] [ ? ] [ ? ] */}
            <div className={`sim-slots-track ${isComplete ? "file-assembled-fused" : ""}`} role="region" aria-label="File Assembly Slots">
              {slots.map((val, idx) => {
                const isHovered = hoveredSlotIndex === idx
                const isFilled = val !== null

                return (
                  <div
                    key={`slot-${idx}`}
                    ref={(el) => {
                      slotRefs.current[idx] = el
                    }}
                    className={`sim-slot ${isFilled ? "filled" : "empty"} ${isHovered ? "hovered" : ""}`}
                    onClick={() => handleSlotClick(idx)}
                    role="button"
                    tabIndex={0}
                    aria-label={`File Slot ${idx + 1}: ${isFilled ? `Piece ${val}` : "Empty"}`}
                  >
                    {isFilled ? (
                      <span className="slot-piece-val">{val}</span>
                    ) : (
                      <span className="slot-empty-glyph">?</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Completion Status Bar */}
            {isComplete && (
              <div className="sim-completion-notice">
                <span className="sim-completion-text">ALL PIECES RECONSTRUCTED</span>
                <div className="sim-completion-actions">
                  <button type="button" className="sim-reset-btn" onClick={handleReset} aria-label="Reconstruct again">
                    ↺ RECONSTRUCT AGAIN
                  </button>
                  <button
                    type="button"
                    className="sim-continue-btn"
                    onClick={() => {
                      if (onContinueToPostTest) {
                        onContinueToPostTest()
                      } else {
                        document.getElementById("post-test")?.scrollIntoView({ behavior: "smooth" })
                      }
                    }}
                  >
                    CONTINUE TO POST-TEST →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Peers Network Area */}
          <div className="sim-peers-mesh" role="region" aria-label="Connected BitTorrent Peers">
            {INITIAL_PEERS.map((peer) => {
              const piecesInPeer = peerPieces[peer.id] || []

              return (
                <div
                  key={peer.id}
                  ref={(el) => {
                    peerRefs.current[peer.id] = el
                  }}
                  className="sim-peer-node"
                >
                  <div className="sim-peer-header">
                    <span className="sim-peer-label">{peer.label}</span>
                    <span className="sim-peer-status">● ONLINE</span>
                  </div>

                  <div className="sim-pieces-bin">
                    {piecesInPeer.length > 0 ? (
                      piecesInPeer.map((pieceId) => {
                        const isDragging = draggingPiece === pieceId
                        const isSelected = selectedPiece === pieceId
                        const isShaking = shakingPiece === pieceId

                        return (
                          <div
                            key={pieceId}
                            className={`sim-piece-chip ${isDragging ? "dragging" : ""} ${isSelected ? "selected" : ""} ${isShaking ? "shaking" : ""}`}
                            onPointerDown={(e) => handlePointerDown(e, pieceId, peer.id)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Draggable Piece ${pieceId}`}
                          >
                            <span className="piece-num">{pieceId}</span>
                          </div>
                        )
                      })
                    ) : (
                      <span className="sim-empty-bin">DRAINED</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reset button when not complete */}
          {!isComplete && placedCount > 0 && (
            <div className="sim-controls-footer">
              <button type="button" className="sim-reset-btn subtle" onClick={handleReset}>
                ↺ RESET SIMULATION
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Dragged Clone Following Pointer */}
      {draggingPiece && (
        <div
          className="sim-floating-drag-piece"
          style={{
            transform: `translate3d(${pointerPos.x - 26}px, ${pointerPos.y - 26}px, 0)`
          }}
          aria-hidden="true"
        >
          <span className="piece-num">{draggingPiece}</span>
        </div>
      )}
    </section>
  )
}
