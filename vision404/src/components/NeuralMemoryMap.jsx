import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Activity, ShieldCheck, ArrowRight, Layers, CheckCircle2, Database, TrendingDown, Tag } from 'lucide-react';

export default function NeuralMemoryMap({ incidents = [], hindsightStats = null, onSelectIncident }) {
  const [selectedNode, setSelectedNode] = useState(incidents[0] || null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // If selectedNode isn't in incidents (e.g. after filter), update it
  React.useEffect(() => {
    if (incidents.length > 0 && (!selectedNode || !incidents.find(i => i.id === selectedNode.id))) {
      setSelectedNode(incidents[0]);
    }
  }, [incidents]);

  const getNodeColor = (factType) => {
    if (factType === 'experience') return '#10b981'; // Emerald
    if (factType === 'observation') return '#a855f7'; // Purple
    if (factType === 'world') return '#f59e0b'; // Amber
    return '#38bdf8'; // Sky blue fallback
  };

  const getNodePosition = (index, total) => {
    const count = Math.max(total, 1);
    const cx = 350;
    const cy = 200;
    const rx = 240;
    const ry = 130;

    const angle = (index / count) * (Math.PI * 2) - Math.PI / 2;
    const x = Math.round(cx + Math.cos(angle) * rx);
    const y = Math.round(cy + Math.sin(angle) * ry);

    return { x, y };
  };

  const nodesWithPositions = incidents.map((inc, idx) => ({
    ...inc,
    pos: {
      ...getNodePosition(idx, incidents.length),
      color: getNodeColor(inc.fact_type)
    }
  }));

  const experienceCount = incidents.filter(i => i.fact_type === 'experience').length;
  const observationCount = incidents.filter(i => i.fact_type === 'observation').length;
  const worldCount = incidents.filter(i => i.fact_type === 'world').length;

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
              Hindsight Episodic Memory Lattice
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              ● LIVE MEMORY LATTICE
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Interactive semantic lattice visualizing 18 indexed memory units and 104 associative neural links.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }}></span> Experiences ({experienceCount})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#a855f7' }}></span> Observations ({observationCount})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }}></span> World Facts ({worldCount})
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 360px', gap: '1.5rem' }}>
        {/* Interactive SVG Canvas */}
        <div style={{
          position: 'relative',
          minHeight: '420px',
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

          {/* Central Hindsight Memory Core */}
          <div style={{
            position: 'absolute',
            left: '350px',
            top: '200px',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0) 70%)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <BrainCircuit size={22} color="var(--cyan-bright)" />
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-subtle)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                CORE
              </span>
            </div>
          </div>

          <svg style={{ width: '100%', height: '100%', minHeight: '420px', position: 'relative', zIndex: 1 }}>
            {/* Draw synaptic connection lines between distinct nodes */}
            {nodesWithPositions.map((nodeA, i) => {
              return nodesWithPositions.slice(i + 1).map((nodeB) => {
                const sameIncident = nodeA.incident_id && nodeB.incident_id && nodeA.incident_id === nodeB.incident_id;
                const isHighlighted = (hoveredNode?.id === nodeA.id || hoveredNode?.id === nodeB.id) ||
                  (selectedNode?.id === nodeA.id || selectedNode?.id === nodeB.id);

                if (!isHighlighted && !sameIncident && (i % 3 !== 0)) return null;

                return (
                  <g key={`${nodeA.id}-${nodeB.id}`}>
                    <line
                      x1={nodeA.pos.x}
                      y1={nodeA.pos.y}
                      x2={nodeB.pos.x}
                      y2={nodeB.pos.y}
                      stroke={isHighlighted ? 'var(--cyan-bright)' : sameIncident ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-subtle)'}
                      strokeWidth={isHighlighted ? 2 : sameIncident ? 1.5 : 1}
                      strokeDasharray={sameIncident ? 'none' : isHighlighted ? 'none' : '4, 4'}
                    />
                    {isHighlighted && (
                      <g transform={`translate(${(nodeA.pos.x + nodeB.pos.x) / 2}, ${(nodeA.pos.y + nodeB.pos.y) / 2})`}>
                        <rect
                          x="-28"
                          y="-9"
                          width="56"
                          height="18"
                          rx="4"
                          fill="var(--bg-card)"
                          stroke="var(--cyan-bright)"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="var(--cyan-bright)"
                          fontSize="9"
                          fontFamily="var(--font-mono)"
                          fontWeight="700"
                        >
                          ~88% sim
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}

            {/* Draw Memory Nodes */}
            {nodesWithPositions.map((item) => {
              const pos = item.pos;
              const isSelected = selectedNode?.id === item.id;
              const isHovered = hoveredNode?.id === item.id;
              const label = item.incident_id || item.id.substring(0, 8);
              const initials = item.fact_type === 'experience' ? 'EXP' : item.fact_type === 'observation' ? 'OBS' : 'WLD';

              return (
                <g
                  key={item.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedNode(item);
                    if (onSelectIncident) onSelectIncident(item);
                  }}
                  onMouseEnter={() => setHoveredNode(item)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Subtle outer pulse glow when selected */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="28"
                      fill="none"
                      stroke={pos.color}
                      strokeWidth="1.5"
                      opacity="0.6"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 20 : isHovered ? 18 : 15}
                    fill={isSelected ? pos.color : 'var(--bg-card)'}
                    stroke={pos.color}
                    strokeWidth={isSelected ? 3 : 2}
                    style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />

                  {/* Acronym text */}
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : pos.color}
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="var(--font-mono)"
                  >
                    {initials}
                  </text>

                  {/* High-Clarity Pill Badge below node */}
                  <g transform={`translate(${pos.x}, ${pos.y + 26})`}>
                    <rect
                      x="-55"
                      y="-9"
                      width="110"
                      height="18"
                      rx="5"
                      fill="var(--bg-card)"
                      stroke={isSelected ? pos.color : 'var(--border-subtle)'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="var(--text-main)"
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      {label.length > 14 ? label.substring(0, 13) + '…' : label}
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
            Click any memory node to inspect causality & proven resolution in Hindsight
          </div>
        </div>

        {/* Selected Memory Inspector Pane */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`badge ${selectedNode.fact_type === 'experience' ? 'badge-emerald' : selectedNode.fact_type === 'observation' ? 'badge-violet' : 'badge-amber'}`} style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  {selectedNode.fact_type}
                </span>
                <span className="badge badge-zinc" style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  {selectedNode.incident_id || selectedNode.id.substring(0, 8)}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.timestamp}
              </span>
            </div>

            <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, lineHeight: '1.45' }}>
              {selectedNode.rootCause || selectedNode.symptom}
            </h4>

            {/* Causality details */}
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
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Action Taken:</span>
                <span style={{ color: 'var(--cyan-bright)', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.actionTaken}
                </span>
              </div>
              {selectedNode.entities && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Entities:</span>
                  <span style={{ color: 'var(--text-main)', textAlign: 'right', maxWidth: '65%', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {selectedNode.entities}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memory Core:</span>
                <span style={{ color: 'var(--text-main)', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  Hindsight Cloud
                </span>
              </div>
            </div>

            {/* Outcome Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Recovery</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  -{selectedNode.deltaCpu}%
                </div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Effectiveness</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.effectivenessScore}%
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-subtle)',
              borderLeft: '3px solid var(--border-active)',
              padding: '8px 12px',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.74rem',
              color: 'var(--text-muted)'
            }}>
              <strong style={{ color: 'var(--text-main)' }}>UUID:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedNode.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
