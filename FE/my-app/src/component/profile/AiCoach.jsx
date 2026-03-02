import React, { useState } from 'react';
import { Sparkles, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { analyzePlayerPerformance } from '../services/geminiService.js';

const AiCoach = ({ user, history }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzePlayerPerformance(user, history);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="ai-card">
      <div className="ai-bg-blur"></div>
      
      <div className="ai-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#fde047' }} />
          <h3 className="font-bold text-lg">AI Performance Coach</h3>
        </div>
        {!analysis && (
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="ai-btn"
          >
            {loading ? <RefreshCw className="animate-spin" style={{ width: '0.75rem', height: '0.75rem' }} /> : 'Analyze Stats'}
          </button>
        )}
      </div>

      <div className="ai-content">
        {!analysis && !loading && (
          <p className="ai-description">
            Get personalized insights powered by Gemini 3.0. Our AI analyzes your recent tournament history to highlight strengths and areas for improvement.
          </p>
        )}

        {loading && (
          <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton-line w-3-4"></div>
            <div className="skeleton-line w-full"></div>
            <div className="skeleton-line w-5-6"></div>
          </div>
        )}

        {analysis && (
          <div className="analysis-section">
            <div style={{ marginBottom: '1rem' }}>
                <p className="analysis-label">Strengths</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {analysis.strengths.map((s, i) => (
                        <div key={i} className="analysis-list-item">
                            <CheckCircle style={{ width: '1rem', height: '1rem', color: '#4ade80', flexShrink: 0, marginTop: '0.125rem' }} />
                            {s}
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
                <p className="analysis-label">Focus Area</p>
                <div className="analysis-list-item">
                     <XCircle style={{ width: '1rem', height: '1rem', color: '#fb923c', flexShrink: 0, marginTop: '0.125rem' }} />
                     {analysis.weaknesses[0] || "None identified"}
                </div>
            </div>

            <div className="tip-box">
                <p className="tip-label">Coach's Tip:</p>
                <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'white' }}>{analysis.advice}</p>
            </div>
            
            <button 
                onClick={() => setAnalysis(null)} 
                className="reset-link"
            >
                Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiCoach;