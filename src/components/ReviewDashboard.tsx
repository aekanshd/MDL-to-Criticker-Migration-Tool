import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { MatchedItem } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ExternalLink, Check, X, SkipForward, Edit2, Download, Trash2, Filter } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { getTitleByImdbId } from "../services/api";

interface ReviewDashboardProps {
  items: MatchedItem[];
  onUpdateItem: (id: string, updates: Partial<MatchedItem>) => void;
  onRemoveItem: (id: string) => void;
  onExport: (type: "reviewed" | "all") => void;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ items, onUpdateItem, onRemoveItem, onExport }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overrideUrl, setOverrideUrl] = useState("");
  const [filter, setFilter] = useState("all");
  const [exportType, setExportType] = useState<"reviewed" | "all">("reviewed");

  const handleBackup = () => {
    const backupData = {
      version: "1.2",
      timestamp: new Date().toISOString(),
      items: items // includes isDeleted ones!
    };
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mdl_sync_backup.json";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    const item = items.find(i => i.id === id);
    setOverrideUrl(item?.imdbUrl || "");
  };

  const saveOverride = async (id: string) => {
    const ttMatch = overrideUrl.match(/tt\d+/);
    const imdbId = ttMatch ? ttMatch[0] : undefined;

    if (!imdbId) {
      onUpdateItem(id, {
        imdbUrl: overrideUrl,
        matchedTitle: undefined,
        imdbId: undefined,
        isManualOverride: true,
        status: "pending"
      });
      setEditingId(null);
      return;
    }

    try {
      const itemInfo = await getTitleByImdbId(imdbId);
      onUpdateItem(id, {
        imdbId,
        imdbUrl: `https://www.imdb.com/title/${imdbId}/`,
        matchedTitle: itemInfo.title,
        isManualOverride: true,
        status: "approved"
      });
    } catch (e) {
      onUpdateItem(id, {
        imdbId,
        imdbUrl: `https://www.imdb.com/title/${imdbId}/`,
        matchedTitle: undefined,
        isManualOverride: true,
        status: "pending"
      });
    }
    setEditingId(null);
  };

  const getRowState = (item: MatchedItem) => {
    const isNotFound = !item.imdbId || !item.matchedTitle;
    const isMismatch = item.imdbId && item.matchedTitle && item.originalTitle.toLowerCase().trim() !== item.matchedTitle.toLowerCase().trim();
    return { isNotFound, isMismatch };
  };

  const filteredItems = items.filter(item => {
    if (item.isDeleted) return false;
    
    if (filter === "all") return true;
    if (filter === "skipped") return item.status === "skipped";
    
    if (item.status === "skipped") return false; // don't show skipped items in these filters unless "all"
    
    const { isNotFound, isMismatch } = getRowState(item);
    if (filter === "unreviewed") return item.status === "pending";
    if (filter === "not-found") return isNotFound;
    if (filter === "mismatch") return isMismatch;
    if (filter === "override") return item.isManualOverride;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Review Matchings</h2>
          <p className="text-slate-400 text-sm italic">Verify matches and scores before generating the .csv export file.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 text-sm items-end sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-black/20 border border-white/10 rounded-lg text-slate-300 text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Show All</option>
              <option value="unreviewed">Unreviewed Only</option>
              <option value="not-found">Not Found (Red)</option>
              <option value="mismatch">Needs Review (Yellow)</option>
              <option value="override">Manual Overrides</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <div className="px-3 py-1.5 glass-panel rounded-lg text-indigo-300">Total: {items.filter(i => !i.isDeleted).length}</div>
            <div className="px-3 py-1.5 glass-panel rounded-lg text-emerald-300">Matched: {items.filter(i => !i.isDeleted && i.imdbId).length}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl shadow-2xl">
        <ScrollArea className="h-[550px]">
          <Table>
            <TableHeader className="bg-black/20 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300 text-[11px] uppercase tracking-wider font-semibold">Original MDL Title</TableHead>
                <TableHead className="text-slate-300 text-[11px] uppercase tracking-wider font-semibold">Rating</TableHead>
                <TableHead className="text-slate-300 text-[11px] uppercase tracking-wider font-semibold">Matched IMDb Title</TableHead>
                <TableHead className="text-slate-300 text-[11px] uppercase tracking-wider font-semibold">IMDb Link</TableHead>
                <TableHead className="text-slate-300 text-[11px] uppercase tracking-wider font-semibold text-center">Score (100)</TableHead>
                <TableHead className="text-slate-300 text-[11px] uppercase tracking-wider font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const { isNotFound, isMismatch } = getRowState(item);
                
                let baseClass = "hover:bg-white/5";
                if (item.status === "skipped") baseClass = "opacity-40 grayscale";
                else if (isNotFound) baseClass = "bg-red-950/40 hover:bg-red-900/40";
                else if (isMismatch) baseClass = "bg-amber-950/40 hover:bg-amber-900/40";
                
                const overrideBorder = item.isManualOverride ? "border-l-4 border-l-indigo-500" : "";
                const className = `border-b border-white/5 transition-colors ${baseClass} ${overrideBorder}`;

                return (
                <TableRow key={item.id} className={className}>
                  <TableCell className="font-medium text-white text-[13px]">{item.originalTitle}</TableCell>
                  <TableCell className="italic text-slate-300">{item.rating} / 10</TableCell>
                  <TableCell>
                    {item.matchedTitle ? (
                      <span className="text-white text-[13px] font-medium">{item.matchedTitle}</span>
                    ) : (
                      <span className="text-red-400 text-xs font-bold uppercase tracking-tighter">Not Found</span>
                    )}
                    {isMismatch && !isNotFound && item.status !== "skipped" && (
                      <Badge variant="outline" className="ml-2 border-amber-500/80 text-amber-300 bg-amber-500/10 text-[10px] scale-75 origin-left font-bold tracking-wider">
                        Review Match
                      </Badge>
                    )}
                    {item.isManualOverride && (
                      <Badge variant="outline" className="ml-2 border-indigo-500/80 text-indigo-300 bg-indigo-500/10 text-[10px] scale-75 origin-left font-bold tracking-wider">
                        Edited
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <div className="flex space-x-2">
                        <Input 
                          value={overrideUrl} 
                          onChange={(e) => setOverrideUrl(e.target.value)} 
                          placeholder="Paste IMDb URL..."
                          className="h-8 text-xs bg-black/40 border-indigo-500/50 text-white"
                        />
                        <Button size="icon" className="h-8 w-8 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" onClick={() => saveOverride(item.id)}><Check className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {item.imdbUrl ? (
                          <a 
                            href={item.imdbUrl} 
                            target="_blank" 
                            rel="no-referrer" 
                            className="text-indigo-400 hover:text-indigo-300 underline flex items-center text-xs font-mono"
                          >
                            {item.imdbId || "Link"} <ExternalLink className="ml-1 w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-indigo-400" onClick={() => handleEdit(item.id)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                     <Input 
                      type="number" 
                      value={item.critickerScore} 
                      onChange={(e) => onUpdateItem(item.id, { critickerScore: parseInt(e.target.value) })}
                      className="w-16 h-8 text-center bg-black/20 border-white/5 text-indigo-200 font-mono focus:ring-1 focus:ring-indigo-500 mx-auto"
                     />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {item.status === "skipped" ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 border-slate-500 text-slate-500 hover:text-white"
                          onClick={() => onUpdateItem(item.id, { status: "approved" })}
                        >
                          RESTORE
                        </Button>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            className={`h-8 px-2 ${item.status === "approved" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
                            onClick={() => onUpdateItem(item.id, { status: "approved" })}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 px-2 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                            onClick={() => onUpdateItem(item.id, { status: "skipped" })}
                          >
                            <SkipForward className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex flex-col gap-4 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-2 text-indigo-200 text-sm">
            <div className="flex items-center gap-2 font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> API Pipeline Ready
            </div>
            <p>
              Verified: {items.filter(i => !i.isDeleted && i.status === "approved" && i.imdbId).length} | 
              Pending: {items.filter(i => !i.isDeleted && i.status === "pending" && i.imdbId).length}
            </p>
            <p className="text-xs text-indigo-300/80 italic">Note: Any deleted or skipped rows will not be included in the export.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              className="bg-black/20 border border-indigo-500/30 rounded-lg text-indigo-100 text-sm px-4 h-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as "reviewed" | "all")}
            >
              <option value="reviewed" className="bg-slate-900 text-indigo-200">Export: Reviewed Only (Approved)</option>
              <option value="all" className="bg-slate-900 text-indigo-200">Export: All Available (Pending + Approved)</option>
            </select>

            <Button 
              size="lg"
              onClick={() => onExport(exportType)} 
              disabled={items.filter(i => !i.isDeleted && (exportType === "all" ? (i.status === "approved" || i.status === "pending") : i.status === "approved") && i.imdbId).length === 0}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 shadow-2xl shadow-indigo-500/50 flex items-center gap-3 h-14"
            >
              <span>GENERATE (.CSV)</span>
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="border-t border-indigo-500/20 pt-4 mt-2 flex flex-row gap-4 justify-start items-center">
          <Button size="sm" className="bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 hover:bg-indigo-500/40 h-9" onClick={handleBackup}>
            <Download className="w-4 h-4 mr-2" /> Backup Entire State
          </Button>
        </div>
      </div>
    </div>
  );
};
