import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface InvestigationGraphProps {
  nodes: Node[];
  edges: Edge[];
}

export const InvestigationGraph: React.FC<InvestigationGraphProps> = ({ nodes: rawNodes, edges: rawEdges }) => {
  const initialNodes = useMemo<Node[]>(() => {
    if (!rawNodes || rawNodes.length === 0) {
      return [
        {
          id: '1',
          position: { x: 250, y: 100 },
          data: { label: 'No indicators associated with graph' },
          style: { 
            background: '#1e293b', 
            color: '#94a3b8', 
            border: '1px solid #334155', 
            borderRadius: '8px', 
            padding: '10px',
            fontSize: '12px',
            width: 220
          }
        }
      ];
    }

    return rawNodes.map((n) => ({
      ...n,
      style: {
        background: n.type === 'emailNode' ? '#0f172a' : n.type === 'senderNode' ? '#1e1b4b' : '#111827',
        color: '#f8fafc',
        border: n.type === 'emailNode' ? '1px solid #06b6d4' : '1px solid #334155',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '12px',
        width: 220
      }
    }));
  }, [rawNodes]);

  const initialEdges = useMemo<Edge[]>(() => {
    return (rawEdges || []).map(e => ({
      ...e,
      style: { stroke: '#06b6d4', strokeWidth: 2 }
    }));
  }, [rawEdges]);

  return (
    <div className="h-[500px] w-full rounded-xl border border-slate-800 bg-[#090d16]">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
      >
        <Background color="#1e293b" gap={16} />
        <Controls />
        <MiniMap nodeColor="#06b6d4" maskColor="rgba(15, 23, 42, 0.7)" />
      </ReactFlow>
    </div>
  );
};
