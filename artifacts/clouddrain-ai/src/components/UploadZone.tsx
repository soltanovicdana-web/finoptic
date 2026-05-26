import { useState, useRef } from "react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { type AnalysisResult } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onUploadSuccess: (data: AnalysisResult) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

export function UploadZone({ onUploadSuccess, onSimulate, isSimulating }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();
  const { toast } = useToast();
  const isLoading = isUploading || isSimulating;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      await processFile(file);
    } else {
      toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      const data = await uploadFile(file);
      onUploadSuccess(data);
      toast({ title: "Analysis complete", description: `${data.resourceCount.toLocaleString()} resources scanned.` });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not process the CSV file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`relative border border-white/[0.09] rounded-xl transition-all duration-200 cursor-pointer
          ${isDragging ? "border-white/25 bg-white/[0.04]" : "hover:border-white/15 hover:bg-white/[0.02]"}
          ${isLoading ? "pointer-events-none opacity-50" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          {/* Thin line-art upload icon */}
          <svg
            className={`w-9 h-9 mb-5 transition-colors duration-200 ${isDragging ? "text-white/60" : "text-white/20"}`}
            viewBox="0 0 36 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="22" width="28" height="10" rx="2" />
            <line x1="18" y1="16" x2="18" y2="4" />
            <polyline points="11,10 18,4 25,10" />
          </svg>

          {isLoading ? (
            <>
              <p className="text-sm font-medium text-foreground mb-1">
                {isSimulating ? "Generating demo data..." : "Analyzing..."}
              </p>
              <p className="text-xs text-muted-foreground">This will take a moment</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground mb-1">
                {isDragging ? "Drop to analyze" : "Drop your AWS CUR file here"}
              </p>
              <p className="text-xs text-muted-foreground">
                Cost and Usage Report — CSV format
              </p>
            </>
          )}
        </div>
      </div>

      {/* Simulate link — subtle, not a big button */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Don't have a CUR file?</span>
        <button
          onClick={onSimulate}
          disabled={isLoading}
          className="text-white/60 hover:text-white underline underline-offset-2 decoration-white/20 hover:decoration-white/40 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSimulating ? "Generating..." : "Run a simulation"}
        </button>
      </div>
    </div>
  );
}
