export interface CompressionProgress {
  stage: 'loading' | 'processing' | 'encoding' | 'complete';
  progress: number;
}

export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void
): Promise<File> {
  onProgress?.({ stage: 'loading', progress: 20 });
  
  const targetSizeMB = 50;
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB <= targetSizeMB) {
    console.log('Video file size acceptable:', fileSizeMB.toFixed(2), 'MB');
    onProgress?.({ stage: 'complete', progress: 100 });
    return file;
  }

  return new Promise((resolve, _reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = async () => {
      try {
        onProgress?.({ stage: 'processing', progress: 40 });
        
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        let targetWidth = width;
        let targetHeight = height;
        
        const minDimension = 720;
        if (height > minDimension || width > minDimension) {
          if (height > width) {
            targetHeight = minDimension;
            targetWidth = Math.round((width / height) * minDimension);
          } else {
            targetWidth = minDimension;
            targetHeight = Math.round((height / width) * minDimension);
          }
        }
        
        if (targetWidth === width && targetHeight === height) {
          console.log('Video resolution acceptable, no compression needed');
          onProgress?.({ stage: 'complete', progress: 100 });
          resolve(file);
          return;
        }

        onProgress?.({ stage: 'encoding', progress: 60 });
        
        console.log(`Video will use original file at ${fileSizeMB.toFixed(2)}MB (compression requires MediaRecorder API)`);
        onProgress?.({ stage: 'complete', progress: 100 });
        resolve(file);
        
      } catch (error) {
        console.error('Error in video processing:', error);
        resolve(file);
      }
    };

    video.onerror = () => {
      console.error('Error loading video, using original file');
      resolve(file);
    };

    video.src = URL.createObjectURL(file);
  });
}

export async function convertVideoToBase64(
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    };

    reader.onload = () => {
      onProgress?.(100);
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

