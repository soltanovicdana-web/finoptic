import { useState, useCallback } from 'react';
import { type AnalysisResult } from '@workspace/api-client-react';

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<AnalysisResult> => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/finops/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to upload file');
      }

      const data = await response.json();
      return data as AnalysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFile, isUploading, error };
}
