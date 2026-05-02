/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { IngestionPage } from "./components/IngestionPage";
import { QADashboard } from "./components/QADashboard";
import { ProcessingPage } from "./components/ProcessingPage";
import { MatchedItem } from "./types";
import { extractPdf, matchItems } from "./services/api";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { ArrowLeft } from "lucide-react";

type Step = "ingestion" | "processing" | "qa";

export default function App() {
  const [step, setStep] = useState<Step>("ingestion");
  const [data, setData] = useState<MatchedItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const handleDataReady = async (items: { originalTitle: string; rating: number }[]) => {
    setStep("processing");
    setData([]);
    setProgress(0);
    setTotalItems(items.length);

    // We process sequentially to avoid TMDB rate limits and show progress
    const matched: MatchedItem[] = [];
    for (let i = 0; i < items.length; i++) {
        const result = await matchItems([items[i]]);
        matched.push(...result);
        setProgress(i + 1);
    }
    
    setData(matched);
    setStep("qa");
    toast.success(`Successfully matched ${matched.length} items!`);
  };

  const handlePdfUpload = async (file: File) => {
    setStep("processing");
    try {
      const text = await extractPdf(file);
      
      // Basic regex extraction for titles and scores in PDF text
      const lines = text.split("\n");
      const items: { originalTitle: string; rating: number }[] = [];
      
      lines.forEach(line => {
        const match = line.trim().match(/(.+?)\s+(\d+(\.\d+)?)$/);
        if (match) {
            const title = match[1].trim();
            let rating = parseFloat(match[2]);
            if (rating > 10 && rating <= 100) rating = rating / 10;
            if (rating > 0 && rating <= 10) items.push({ originalTitle: title, rating });
        }
      });

      if (items.length === 0) {
        throw new Error("No ratings found in PDF. Try Printing to PDF again.");
      }

      await handleDataReady(items);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse PDF");
      setStep("ingestion");
    }
  };

  const updateItem = (id: string, updates: Partial<MatchedItem>) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  };

  const handleRestore = (importedItems: MatchedItem[]) => {
    setData(importedItems);
    setTotalItems(importedItems.length);
    toast.success(`Restored ${importedItems.length} records!`);
  };

  const handleExport = (exportType: "all" | "reviewed") => {
    const toExport = data.filter(item => 
      (exportType === "all" ? (item.status === "approved" || item.status === "pending") : item.status === "approved") && item.imdbId
    );
    
    if (toExport.length === 0) {
      toast.error("No valid items to export based on selected criteria.");
      return;
    }

    const headers = "imdb_id,rating";
    const rows = toExport.map(item => `${item.imdbId},${item.critickerScore}`).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "criticker_export.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(`CSV Export Triggered with ${toExport.length} records!`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="mesh-bg" />
      
      <div className="max-w-6xl mx-auto p-8 relative z-10 space-y-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MDL ➔ Criticker Sync</h1>
              <p className="text-indigo-300 text-xs">MyDramaList Migration Pipeline v1.2</p>
            </div>
          </div>

          <div className="flex gap-2 p-1 glass-panel rounded-full">
            <div className={`step-pill ${step === 'ingestion' ? 'active' : ''}`}>1. Input</div>
            <div className={`step-pill ${step === 'processing' ? 'active' : ''}`}>2. Match</div>
            <div className={`step-pill ${step === 'qa' ? 'active' : ''}`}>3. Review</div>
          </div>
        </header>

        <main className="flex-1">
          {step === "ingestion" && (
            <IngestionPage onDataReady={handleDataReady} onPdfUpload={handlePdfUpload} />
          )}

          {step === "processing" && (
            <ProcessingPage progress={progress} total={totalItems} />
          )}

          {step === "qa" && (
            <QADashboard 
              items={data} 
              onUpdateItem={updateItem} 
              onRemoveItem={removeItem}
              onExport={handleExport}
              onRestore={handleRestore}
            />
          )}
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

