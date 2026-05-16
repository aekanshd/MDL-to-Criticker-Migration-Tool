import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ExternalLink, Key } from "lucide-react";
import { toast } from "sonner";
import { decryptToken } from "@/lib/encryption";

interface SettingsDialogProps {
  onSave: (apiKey: string) => void;
  currentApiKey: string;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onSave, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(() => decryptToken(currentApiKey));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setApiKey(decryptToken(currentApiKey));
  }, [currentApiKey]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API Key");
      return;
    }
    onSave(apiKey);
    setIsOpen(false);
    toast.success("Settings saved successfully");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" />}>
        <Settings className="w-5 h-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Application Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure your TMDB API Key for title matching.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-white">TMDB API Read Access Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                id="api-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiJ9..."
                className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus:ring-indigo-500"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Note: This is stored in your browser session and never sent to a third party except TMDB.
            </p>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
              <ExternalLink className="w-3 h-3" />
              How to get a TMDB API Key?
            </h4>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
              <li>Create an account on <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">TheMovieDB.org</a>.</li>
              <li>Go to <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Settings &gt; API</a>.</li>
              <li>Request an API Key (choose 'Developer' and 'Personal').</li>
              <li>Once approved, find the <strong>API Read Access Token</strong> (v4 auth).</li>
              <li>Copy and paste that long string into the field above.</li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full">
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
