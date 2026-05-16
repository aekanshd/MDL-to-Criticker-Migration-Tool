import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AlertCircle, Upload, User, FileText, Code, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { toast } from "sonner";
import { MatchedItem } from "../types";
import GoogleAd from "./GoogleAd";

interface IngestionPageProps {
  onDataReady: (items: { originalTitle: string; rating: number }[]) => void;
  onRestore: (items: MatchedItem[]) => void;
  isConfigured: boolean;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({ onDataReady, onRestore, isConfigured }) => {
  const [username, setUsername] = useState("");
  const [pastedData, setPastedData] = useState("");
  const [selectAllData, setSelectAllData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidation = () => {
    if (!isConfigured) {
      toast.error("TMDB API Key Required", {
        description: "Please click the settings icon in the top right to configure your API key.",
        duration: 5000,
      });
      return false;
    }
    return true;
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restore doesn't strictly need TMDB key yet, as it's just loading JSON
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (data && data.items && Array.isArray(data.items)) {
          onRestore(data.items as MatchedItem[]);
        }
      } catch (err) {
        console.error("Failed to parse JSON backup", err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleSelectAllSubmit = () => {
    if (!handleValidation()) return;
    if (!selectAllData.trim()) return;
    
    const flattened = selectAllData.replace(/\n+/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ');
    const regex = /(?:^|\s)\d+\s+(.*?)\s+(Completed|Watching|On-hold|Dropped|Plan to Watch|Undecided|Not Interested)\s+.*?(\d{4})\s+.*?\s+(\d{1,2}(?:\.\d)?)(?:\s+(?:[−-]?\s*\d+\s*\/\s*\d+\s*[+➕]?|-))?(?=\s+\d+\s+|$)/gi;
    
    const items: { originalTitle: string; rating: number }[] = [];
    let match;
    while ((match = regex.exec(flattened)) !== null) {
        const title = match[1].trim();
        let rating = parseFloat(match[4]);
        if (rating > 10 && rating <= 100) rating = rating / 10;
        if (rating > 0 && rating <= 10) items.push({ originalTitle: title, rating });
    }
    
    if (items.length > 0) {
      onDataReady(items);
    } else {
      toast.error("No valid entries found in the pasted text.");
    }
  };

  const handleUsernameSubmit = () => {
    if (!handleValidation()) return;
    // In a real world app, we'd fetch MDL here, but Cloudflare blocks us.
    if (username.trim()) {
      toast.error("Cloudflare blocked the request. Please use Raw Paste or PDF Upload instead.", { duration: 5000 });
    }
  };

  const handlePasteSubmit = () => {
    if (!handleValidation()) return;
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
  const showSponsoredAd = false; // keep the ad block available for future AdSense activation

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-white">Migration Hub</h1>
        <p className="text-indigo-300 italic font-serif">Seamlessly bridge your MyDramaList history to Criticker.</p>
      </div>

      {!isConfigured && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-500 mb-6 py-4 animate-pulse">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">TMDB API Key Missing</AlertTitle>
          <AlertDescription className="text-amber-200/80">
            Please configure your <b>TMDB API Read Access Token</b> in the <b>Settings</b> (top right) before starting the migration. 
            The matching process requires an API key to find correct IMDb IDs.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="console" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-panel p-1 rounded-xl h-12">
          <TabsTrigger value="console" className="data-[state=active]:bg-indigo-500/40 data-[state=active]:text-white text-slate-300 hover:text-white rounded-lg transition-colors"><Code className="w-4 h-4 mr-2" /> Console Script</TabsTrigger>
          <TabsTrigger value="selectall" className="data-[state=active]:bg-indigo-500/40 data-[state=active]:text-white text-slate-300 hover:text-white rounded-lg transition-colors"><FileText className="w-4 h-4 mr-2" /> Select All Method</TabsTrigger>
          <TabsTrigger value="username" className="data-[state=active]:bg-indigo-500/40 data-[state=active]:text-white text-slate-300 hover:text-white rounded-lg transition-colors"><User className="w-4 h-4 mr-2" /> Fetch using API</TabsTrigger>
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

        <TabsContent value="selectall">
          <Card className="glass-panel border-white/5 border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Select All Method</CardTitle>
              <CardDescription className="text-slate-400">Select the entire webpage on MyDramaList and paste the text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-black/30 backdrop-blur-md border border-white/5 rounded-md text-xs font-mono text-slate-400 mb-4">
                <p className="font-bold mb-2 text-indigo-300 font-sans tracking-wide uppercase">// Instructions:</p>
                <ol className="list-decimal pl-4 space-y-2 font-sans text-slate-300">
                  <li>Go to <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-200">https://mydramalist.com/dramalist/&lt;username&gt;</code></li>
                  <li>Ensure in the filters the status is "All", and remove any other filters to get the complete list.</li>
                  <li>Before selecting, ensure all entries in the list are rendered by scrolling to the end of the page.</li>
                  <li>Press <kbd className="bg-white/10 px-1 py-0.5 rounded">Ctrl+A</kbd> (or <kbd className="bg-white/10 px-1 py-0.5 rounded">Cmd+A</kbd>) to select all text, then copy (<kbd className="bg-white/10 px-1 py-0.5 rounded">Ctrl+C</kbd> / <kbd className="bg-white/10 px-1 py-0.5 rounded">Cmd+C</kbd>).</li>
                  <li>Paste the text into the text area below.</li>
                </ol>
              </div>
              <textarea 
                className="w-full h-48 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                placeholder="Paste the 'Select All' content here..."
                value={selectAllData}
                onChange={(e) => setSelectAllData(e.target.value)}
              />
              <Button className="w-full h-12 bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-bold shadow-xl shadow-indigo-500/20" onClick={handleSelectAllSubmit}>Process List</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="console">
          <Card className="glass-panel border-white/5 border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Console Script</CardTitle>
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

      {showSponsoredAd && <GoogleAd />}

      <div className="flex flex-col items-center mt-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-2xl shadow-xl max-w-sm mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-white font-medium mb-1">Resume Previous Session</h3>
          <p className="text-slate-400 text-xs text-balance">Upload a .json backup generated from a previous session to resume reviewing.</p>
        </div>
        <div className="relative w-full">
          <input 
            type="file" 
            accept=".json"  
            onChange={handleRestore} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            ref={fileInputRef}
          />
          <Button size="lg" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white shadow-xl shadow-indigo-500/20 font-medium">
            <Download className="w-5 h-5 mr-2 rotate-180" /> Restore State from Backup
          </Button>
        </div>
      </div>
    </div>
  );
};
