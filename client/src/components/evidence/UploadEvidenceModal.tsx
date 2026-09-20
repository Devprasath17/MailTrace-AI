import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { X, Upload, FileCheck, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const UploadEvidenceModal: React.FC<Props> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState('EML');
  const [investigationId, setInvestigationId] = useState('');
  const [progressState, setProgressState] = useState<'IDLE' | 'UPLOADING' | 'HASHING' | 'PRESERVING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Please select a file to upload.');

      setProgressState('UPLOADING');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('evidenceType', evidenceType);
      if (investigationId) formData.append('investigationId', investigationId);

      setTimeout(() => setProgressState('HASHING'), 300);
      setTimeout(() => setProgressState('PRESERVING'), 700);

      const res = await api.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      setProgressState('COMPLETED');
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (err: any) => {
      setProgressState('FAILED');
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to upload evidence artifact.');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.name.endsWith('.eml')) setEvidenceType('EML');
      else if (file.name.endsWith('.pdf')) setEvidenceType('REPORT');
      else if (file.name.endsWith('.png') || file.name.endsWith('.jpg')) setEvidenceType('SCREENSHOT');
      else setEvidenceType('ATTACHMENT');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setErrorMessage('');
    uploadMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0b101d] p-6 text-slate-100 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-400" />
              <span>Upload Forensic Evidence</span>
            </h3>
            <p className="text-xs text-slate-400">Preserve raw EML files, headers, reports, and evidence artifacts.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          
          {/* File Picker */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Evidence Artifact File</label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/60 p-6 text-center hover:border-cyan-500/50 transition-colors">

              <Upload className="h-8 w-8 text-slate-500 mb-2" />
              {selectedFile ? (
                <div className="space-y-1">
                  <span className="font-mono font-bold text-cyan-400 block">{selectedFile.name}</span>
                  <span className="text-slate-400 text-[11px]">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div>
                  <span className="text-slate-300 font-semibold block">Click to select or drag & drop</span>
                  <span className="text-slate-500 text-[11px]">Supports .EML, .PDF, .PNG, .TXT, .JSON (Max 25MB)</span>
                </div>
              )}
              <input 
                type="file" 
                onChange={handleFileChange}
                accept=".eml,.pdf,.png,.jpg,.txt,.json,.msg"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Evidence Type */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">Artifact Category</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="EML">EML Raw Email Header/Content</option>
              <option value="ATTACHMENT">Email Attachment Artifact</option>
              <option value="REPORT">Investigation Forensic Report</option>
              <option value="SCREENSHOT">Incident Capture / Screenshot</option>
              <option value="HEADER">Extracted MIME Headers</option>
            </select>
          </div>

          {/* Investigation Reference */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">Case / Investigation ID (Optional)</label>
            <input
              type="text"
              value={investigationId}
              onChange={(e) => setInvestigationId(e.target.value)}
              placeholder="e.g. inv-1789883... or leave empty for general vault"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          {/* Progress Banner */}
          {progressState !== 'IDLE' && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="flex items-center gap-1.5">
                  {progressState === 'COMPLETED' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : progressState === 'FAILED' ? (
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-cyan-400 animate-spin" />
                  )}
                  <span>Status: {progressState}</span>
                </span>
              </div>

              {progressState === 'COMPLETED' && (
                <p className="text-emerald-400">File uploaded and cryptographic SHA-256 hash stored in vault.</p>
              )}

              {errorMessage && (
                <p className="text-rose-400">{errorMessage}</p>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending || progressState === 'COMPLETED'}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Preserving...' : 'Upload Artifact'}
          </button>
        </div>

      </div>
    </div>
  );
};
