import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Activity, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

export default function NeuralMemoryMap({ incidents, onSelectIncident }) {
  const [selectedNode, setSelectedNode] = useState(incidents[0] || null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Dynamically compute unique, spacious coordinates for every incident so NO nodes or labels ever collide
  const getNodePosition = (index, total) => {
    const count = Math.max(total, 1);
    const cx = 350;
    const cy = 195;
    const rx = 230;
    const ry = 120;

    const angle = (index / count) * (Math.PI * 2) - Math.PI / 2;
    const x = Math.round(cx + Math.cos(angle) * rx);
    const y = Math.round(cy + Math.sin(angle) * ry);

    const colors = ['#71717a', '#10b981', '#a1a1aa', '#f59e0b', '#78716c', '#52525b'];
    return {
      x,
      y,
      color: colors[index % colors.length]
    };
  };

  // Pre-calculate positions map with 1-to-1 incident binding
  const nodesWithPositions = incidents.map((inc, idx) => ({
    ...inc,
    pos: getNodePosition(idx, incidents.length)
  }));

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '18px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} color="var(--text-main)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Semantic Vector Similarity Lattice
            </h3>
            <span className="badge badge-zinc" style={{ fontSize: '0.68rem' }}>
              Interactive 2D Embeddings
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Topological map of episodic memories clustered by telemetry failure signatures and root-cause embeddings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#71717a' }}></span> Chrome / Edge
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#a1a1aa' }}></span> Antigravity / Node
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }}></span> Windows OS / Shell
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 340px', gap: '1.5rem' }}>
        {/* Interactive SVG Canvas */}
        <div style={{
          position: 'relative',
          minHeight: '390px',
          background: 'var(--bg-inset)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}>
          {/* Subtle grid background dots */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(var(--border-active) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.35
          }} />

          <svg style={{ width: '100%', height: '100%', minHeight: '390px', position: 'relative', zIndex: 1 }}>
            {/* Draw synaptic connection lines between distinct nodes */}
            {nodesWithPositions.map((nodeA, i) => {
              return nodesWithPositions.slice(i + 1).map((nodeB) => {
                const isHighlighted = (hoveredNode?.id === nodeA.id || hoveredNode?.id === nodeB.id) ||
                  (selectedNode?.id === nodeA.id || selectedNode?.id === nodeB.id);

                return (
                  <g key={`${nodeA.id}-${nodeB.id}`}>
                    <line
                      x1={nodeA.pos.x}
                      y1={nodeA.pos.y}
                      x2={nodeB.pos.x}
                      y2={nodeB.pos.y}
                      stroke={isHighlighted ? 'var(--text-main)' : 'var(--border-subtle)'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? 'none' : '4, 4'}
                    />
                    {/* Similarity score badge */}
                    {isHighlighted && (
                      <g transform={`translate(${(nodeA.pos.x + nodeB.pos.x) / 2}, ${(nodeA.pos.y + nodeB.pos.y) / 2})`}>
                        <rect
                          x="-32"
                          y="-10"
                          width="64"
                          height="20"
                          rx="4"
                          fill="var(--bg-card)"
                          stroke="var(--border-active)"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="4"
                          fill="var(--text-main)"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="var(--font-mono)"
                          textAnchor="middle"
                        >
                          ~84% sim
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}

            {/* Draw Incident Nodes & High-Clarity Label Badges */}
            {nodesWithPositions.map((item) => {
              const { pos } = item;
              const isSelected = selectedNode?.id === item.id;
              const isHovered = hoveredNode?.id === item.id;

              return (
                <g
                  key={item.id}
                  onClick={() => {
                    setSelectedNode(item);
                    if (onSelectIncident) onSelectIncident(item);
                  }}
                  onMouseEnter={() => setHoveredNode(item)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer pulse wave if selected */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={36}
                      fill="none"
                      stroke={pos.color}
                      strokeWidth="1.8"
                      opacity="0.3"
                    >
                      <animate
                        attributeName="r"
                        values="26;42;26"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.05;0.4"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Main Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected || isHovered ? 26 : 22}
                    fill={isSelected ? pos.color : 'var(--bg-card)'}
                    stroke={pos.color}
                    strokeWidth={isSelected ? 3 : 2}
                    style={{ transition: 'all 0.2s ease' }}
                  />

                  {/* Node ID Text Inside Circle */}
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : 'var(--text-main)'}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="var(--font-mono)"
                  >
                    #{item.id.replace('INC-', '')}
                  </text>

                  {/* High-Clarity Pill Badge below node */}
                  <g transform={`translate(${pos.x}, ${pos.y + 36})`}>
                    <rect
                      x="-65"
                      y="-11"
                      width="130"
                      height="22"
                      rx="6"
                      fill="var(--bg-card)"
                      stroke={isSelected ? pos.color : 'var(--border-subtle)'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="var(--text-main)"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="var(--font-sans)"
                      letterSpacing="0.01em"
                    >
                      {item.app.length > 16 ? item.app.substring(0, 15) + '…' : item.app}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            fontSize: '0.72rem',
            color: 'var(--text-subtle)',
            fontFamily: 'var(--font-mono)'
          }}>
            Click any memory node to inspect causality & proven resolution
          </div>
        </div>

        {/* Selected Incident Inspector Pane */}
        {selectedNode && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="badge badge-zinc" style={{ fontWeight: 700 }}>{selectedNode.id}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.timestamp.split(' ')[0]}
              </span>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
              {selectedNode.app}: {selectedNode.symptom}
            </h4>

            <div style={{
              background: 'var(--bg-subtle)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Root Cause:</span>
                <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '65%', fontWeight: 500 }}>
                  {selectedNode.rootCause}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Action Taken:</span>
                <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '65%', fontWeight: 600 }}>
                  {selectedNode.actionTaken}
                </span>
              </div>
            </div>

            {/* Outcome Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Restored</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.deltaCpu}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Effectiveness</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.effectivenessScore}%
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-subtle)',
              borderLeft: '3px solid var(--border-active)',
              padding: '8px 12px',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              <strong style={{ color: 'var(--text-main)' }}>Human Verification:</strong> "{selectedNode.userNotes}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
