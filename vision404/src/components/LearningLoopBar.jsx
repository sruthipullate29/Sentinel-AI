import React from 'react';
import { 
  Activity, 
  Database, 
  Brain, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Gauge, 
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { LEARNING_LOOP_STEPS } from '../data/mockData';

const ICONS = {
  Activity,
  Database,
  Brain,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Gauge,
  CheckCircle2
};

export default function LearningLoopBar({ activeStepId, onSelectStep }) {
  return (
    <div className="learning-loop-bar">
      <div className="learning-loop-inner">
        {LEARNING_LOOP_STEPS.map((step, index) => {
          const IconComponent = ICONS[step.icon] || Activity;
          const isActive = activeStepId === step.id;
          const isRememberOutcome = step.id === 'remember_outcome';

          return (
            <React.Fragment key={step.id}>
              <div 
                className={`loop-step-item ${isActive ? (isRememberOutcome ? 'active-violet' : 'active') : ''}`}
                onClick={() => onSelectStep && onSelectStep(step)}
                title={`${step.label}: ${step.desc}`}
              >
                <div className="step-number">{index + 1}</div>
                <IconComponent 
                  size={15} 
                  color={isActive ? 'var(--text-main)' : 'var(--text-muted)'} 
                />
                <span style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)'
                }}>
                  {step.label}
                </span>
                {isActive && (
                  <span style={{ 
                    background: 'var(--primary)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    display: 'inline-block'
                  }}></span>
                )}
              </div>

              {index < LEARNING_LOOP_STEPS.length - 1 && (
                <ChevronRight className="loop-arrow" size={14} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
