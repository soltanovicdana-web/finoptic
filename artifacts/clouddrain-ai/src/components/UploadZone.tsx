import { useState, useRef } from "react";
import { UploadCloud, FileType, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    if (file && file.name.endsWith('.csv')) {
      await processFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      const data = await uploadFile(file);
      onUploadSuccess(data);
      toast({
        title: "Upload Successful",
        description: `Analyzed ${data.resourceCount} resources.`,
      });
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Failed to process CUR file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 lg:gap-12 mt-12 items-stretch">
      <div
        className={`relative border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 text-center bg-card/50 ${
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/30 hover:border-primary/50"
        } ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div className="w-16 h-16 mb-4 rounded bg-muted/50 flex items-center justify-center border border-border">
          {isUploading ? (
            <Activity className="w-8 h-8 text-primary animate-pulse" />
          ) : (
            <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">Upload AWS CUR</h3>
        <p className="text-sm text-muted-foreground max-w-[250px] mb-4">
          Drop your Cost and Usage Report CSV here or click to browse.
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <FileType className="w-4 h-4" />
          <span>CSV Format Only</span>
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <Activity className="w-8 h-8 text-primary animate-pulse mb-2" />
              <span className="font-mono text-primary text-sm tracking-widest uppercase">Processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center space-y-6 bg-card border border-border p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-700"></div>
        <div>
          <h3 className="text-2xl font-bold mb-2 text-foreground font-sans">No CUR file?</h3>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed">
            Run a simulation to generate a realistic AWS environment with targeted cloud waste anomalies.
          </p>
        </div>
        <Button
          onClick={onSimulate}
          disabled={isSimulating}
          className="w-full sm:w-auto self-start bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-mono font-bold tracking-wider rounded-none transition-all py-6 px-8 relative overflow-hidden"
        >
          {isSimulating ? (
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin" />
              GENERATING...
            </span>
          ) : (
            "SIMULATE DEMO DATA"
          )}
        </Button>
      </div>
    </div>
  );
}
