import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AlertCircle, Upload, User, FileText, Code } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface IngestionPageProps {
  onDataReady: (items: { originalTitle: string; rating: number }[]) => void;
  onPdfUpload: (file: File) => void;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({ onDataReady, onPdfUpload }) => {
  const [username, setUsername] = useState("");
  const [pastedData, setPastedData] = useState("");

  const handleUsernameSubmit = () => {
    // In a real world app, we'd fetch MDL here, but Cloudflare blocks us.
    // We'll show the alternative instructions as requested.
  };

  const handlePasteSubmit = () => {
    // Advanced parsing for MDL titles/scores
    const lines = pastedData.split("\n");
    const parsed = lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // 1. Try Pipe Format: "Title | Score" (from our updated console script)
        const pipeMatch = trimmed.match(/^(.+?)\s?\|\s?(\d+(\.\d+)?)$/);
        if (pipeMatch) {
          const rating = parseFloat(pipeMatch[2]);
          if (rating > 0) return { originalTitle: pipeMatch[1].trim(), rating };
        }

        // 2. Try Standard MDL Row Format: "Index Title Status Country Year Type Score Progress"
        // Example: "3 Hotel del Luna Watching South Korea 2019 Drama 9.0 16/16"
        const rowMatch = trimmed.match(/^(?:\d+\s)?(.+?)\s+(?:Watching|Completed|On Hold|Dropped|Plan to Watch)\s+.+?\s+\d{4}\s+(?:Drama|Movie|Special|TV Show|Animation)\s+(\d+(\.\d+)?)\s+/i);
        if (rowMatch) {
          const rating = parseFloat(rowMatch[2]);
          if (rating > 0) return { originalTitle: rowMatch[1].trim(), rating };
        }

        // 3. Fallback: Last number in line (often the score)
        const fallbackMatch = trimmed.match(/(.+?)\s+(\d+(\.\d+)?)$/);
        if (fallbackMatch) {
          const rating = parseFloat(fallbackMatch[2]);
          if (rating > 0) return { originalTitle: fallbackMatch[1].trim(), rating };
        }

        return null;
      })
      .filter((i): i is { originalTitle: string; rating: number } => i !== null);

    if (parsed.length > 0) {
      onDataReady(parsed);
    }
  };

  const bookmarkletScript = `copy(Array.from(document.querySelectorAll("tr[id^='ml']")).map(r => { const t = r.querySelector('.title span')?.innerText; const s = r.querySelector('.score')?.innerText; return (t && s && s !== '0.0') ? \`\${t} | \${s}\` : null; }).filter(Boolean).join('\\n'))`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-5xl font-bold tracking-tight text-white">Migration Hub</h1>
        <p className="text-indigo-300 italic font-serif">Seamlessly bridge your MyDramaList history to Criticker.</p>
      </div>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-panel p-1 rounded-xl h-12">
          <TabsTrigger value="username" className="data-[state=active]:bg-indigo-500/40 data-[state=active]:text-white text-slate-300 hover:text-white rounded-lg transition-colors"><User className="w-4 h-4 mr-2" /> Username</TabsTrigger>
          <TabsTrigger value="pdf" className="data-[state=active]:bg-indigo-500/40 data-[state=active]:text-white text-slate-300 hover:text-white rounded-lg transition-colors"><Upload className="w-4 h-4 mr-2" /> PDF Upload</TabsTrigger>
          <TabsTrigger value="paste" className="data-[state=active]:bg-indigo-500/40 data-[state=active]:text-white text-slate-300 hover:text-white rounded-lg transition-colors"><Code className="w-4 h-4 mr-2" /> Raw Paste</TabsTrigger>
        </TabsList>

        <TabsContent value="username">
          <Card className="glass-panel border-white/5 border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">MDL Username Import</CardTitle>
              <CardDescription className="text-slate-400">Enter your MyDramaList username to fetch your completed list.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div className="flex space-x-2">
                <Input placeholder="MDL Username (e.g. drama_fan)" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
                <Button onClick={handleUsernameSubmit} className="bg-indigo-500 hover:bg-indigo-400 text-white border-none">Fetch List</Button>
              </div>
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cloudflare Limitation</AlertTitle>
                <AlertDescription>
                  Direct fetching may fail due to MyDramaList's Cloudflare protection. Use the **Raw Paste** (Bookmarklet) or **PDF Upload** method if this fails.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf">
          <Card className="glass-panel border-white/5 border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">PDF Export Upload</CardTitle>
              <CardDescription className="text-slate-400">Print your MDL list to PDF (Ctrl+P) and upload it here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center space-y-4 hover:bg-white/5 transition-all cursor-pointer group"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <div className="bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-white">Click or drag PDF here</p>
                  <p className="text-sm text-slate-400">MDL Web-to-PDF print-outs work best.</p>
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPdfUpload(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste">
          <Card className="glass-panel border-white/5 border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Raw Data Paste</CardTitle>
              <CardDescription className="text-slate-400">Paste raw text extracted from MDL console or CSV.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-black/30 backdrop-blur-md border border-white/5 rounded-md text-xs font-mono text-slate-400 mb-4">
                <p className="font-bold mb-2 text-indigo-300 font-sans tracking-wide uppercase">// Instructions:</p>
                <ol className="list-decimal pl-4 space-y-2 font-sans text-slate-300">
                  <li>Go to <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-200">https://mydramalist.com/dramalist/&lt;username&gt;</code></li>
                  <li>Ensure in the filters the status is "All", and remove any other filters to get the complete list.</li>
                  <li>Before running the copy command, ensure all entries in the list are rendered on the page by scrolling till the end of the page.</li>
                  <li>Open your browser console (F12) and run the script below:</li>
                </ol>
                <code className="block mt-3 mb-3 p-3 bg-black/50 border border-white/5 rounded select-all break-all whitespace-pre-wrap text-indigo-200">
                  {bookmarkletScript}
                </code>
                <p className="font-sans text-slate-300 pl-1">5. The data is now in your clipboard. Paste the result in the text area below.</p>
              </div>
              <textarea 
                className="w-full h-48 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                placeholder="Hospital Playlist 10.0&#10;Twenty-Five Twenty-One 9.5"
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
              />
              <Button className="w-full h-12 bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-bold shadow-xl shadow-indigo-500/20" onClick={handlePasteSubmit}>Process Paste</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
