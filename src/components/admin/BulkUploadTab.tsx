import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Subject } from '../../types';
import { api } from '../../services/api';

interface BulkUploadTabProps {
  subjects: Subject[];
  onSuccess: () => void;
  showNotification: (type: 'success' | 'error', msg: string) => void;
}

export const BulkUploadTab: React.FC<BulkUploadTabProps> = ({
  subjects,
  onSuccess,
  showNotification
}) => {
  const [csvText, setCsvText] = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleDownloadSample = () => {
    window.open('/api/questions/sample-csv', '_blank');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCsvText(text);
      setPreviewResult(null);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      showNotification('error', 'Please paste CSV content or upload a CSV file.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.importQuestionsCsv(csvText, true);
      setPreviewResult(res);
      showNotification('success', `Preview parsed: ${res.valid_count} valid rows, ${res.error_count} errors.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    try {
      setImporting(true);
      const res = await api.importQuestionsCsv(csvText, false);
      showNotification('success', res.message || `Successfully imported ${res.valid_count} questions.`);
      setPreviewResult(null);
      setCsvText('');
      onSuccess();
    } catch (err: any) {
      showNotification('error', err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            <span>Bulk CSV Import</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Import hundreds of NCERT Class 10 questions at once with automated column validation and error auditing.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* CSV Input Options */}
      <div className="space-y-4 text-xs">
        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto" />
          <div className="font-bold text-slate-800">Drag and drop your .csv file here, or browse</div>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 uppercase">Or Paste Raw CSV Data Directly</label>
            <span className="text-[11px] text-slate-400">Comma-separated with header row</span>
          </div>
          <textarea
            rows={8}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="subject_id,chapter_id,topic,difficulty,question_type,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,marks,negative_marks,status
science,ch-sci-1,Chemical Reactions,medium,mcq,What happens when zinc reacts with dilute sulfuric acid?,Hydrogen gas evolved,Oxygen gas evolved,Chlorine gas evolved,No reaction,A,Zinc reacts with sulfuric acid to form zinc sulfate and hydrogen gas.,1.0,0.0,published"
            className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Always run a validation preview to catch line errors before writing to the database.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              disabled={loading || !csvText.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Validate & Preview Rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Preview Results */}
      {previewResult && (
        <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Total Rows Scanned</div>
              <div className="text-2xl font-black text-blue-950 mt-1">{previewResult.total_rows}</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Valid Ready to Import</div>
              <div className="text-2xl font-black text-emerald-950 mt-1">{previewResult.valid_count}</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Row Errors Found</div>
              <div className="text-2xl font-black text-rose-950 mt-1">{previewResult.error_count}</div>
            </div>
          </div>

          {previewResult.errors && previewResult.errors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Validation Errors (These rows will be skipped during import):</span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-rose-100 text-xs text-rose-800">
                {previewResult.errors.map((err: any, idx: number) => (
                  <div key={idx} className="py-1 flex items-start gap-2">
                    <span className="font-mono font-bold">Line {err.line}:</span>
                    <span>{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
            <div>
              <div className="font-bold text-slate-900 text-xs">Ready to commit to Question Bank?</div>
              <div className="text-[11px] text-slate-500">
                {previewResult.valid_count} question records will be added to the live database.
              </div>
            </div>

            <button
              onClick={handleCommitImport}
              disabled={importing || previewResult.valid_count === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{importing ? 'Importing Questions...' : `Commit ${previewResult.valid_count} Questions`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
