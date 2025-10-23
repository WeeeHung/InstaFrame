
import React, { useState, useRef, useCallback } from 'react';
import { AspectRatio } from './types';
import { generateImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, DownloadIcon, ClearIcon } from './components/icons';

type Mode = 'upload' | 'generate';

const aspectRatios: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const Header: React.FC = () => (
  <header className="text-center p-4 border-b border-gray-700">
    <h1 className="text-3xl font-bold text-white tracking-tight">
      Insta<span className="text-pink-500">Frame</span> AI
    </h1>
    <p className="text-gray-400 text-sm mt-1">Format & Generate Images for Instagram</p>
  </header>
);

interface ModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode }) => (
  <div className="flex justify-center p-4">
    <div className="flex space-x-2 bg-gray-800 rounded-full p-1">
      <button
        onClick={() => setMode('upload')}
        className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${mode === 'upload' ? 'bg-pink-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
      >
        Upload
      </button>
      <button
        onClick={() => setMode('generate')}
        className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${mode === 'generate' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
      >
        Generate
      </button>
    </div>
  </div>
);

interface ImageUploaderProps {
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  isDragging: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onDrop, onDragOver, onDragLeave, isDragging }) => (
    <div className="p-4 flex justify-center">
        <label
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`w-full max-w-md cursor-pointer bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl border-2 border-dashed border-gray-600 hover:border-pink-500 transition-all duration-300 flex flex-col items-center justify-center text-center ${isDragging ? 'border-pink-500 bg-gray-700 scale-105' : ''}`}
            htmlFor="file-upload"
        >
            <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
            <span className="text-lg">Choose a photo</span>
            <span className="text-xs text-gray-500">or drag and drop</span>
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
        </label>
    </div>
);


interface ImageGeneratorProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ prompt, setPrompt, aspectRatio, setAspectRatio, onGenerate, isLoading }) => (
    <div className="p-4 space-y-4 max-w-md mx-auto">
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic cityscape at sunset, synthwave style"
            className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300 resize-none"
            rows={3}
        />
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
                {aspectRatios.map(ratio => (
                    <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 px-1 text-xs font-semibold rounded-md transition-all duration-300 ${aspectRatio === ratio ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        {ratio}
                    </button>
                ))}
            </div>
        </div>
        <button
            onClick={onGenerate}
            disabled={isLoading || !prompt}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
        >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Image'}
        </button>
    </div>
);


interface ImagePreviewProps {
    formattedImageUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ formattedImageUrl, isLoading, error }) => (
    <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 shadow-lg">
            {isLoading ? (
                <div className="flex flex-col items-center text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    <p className="mt-4 text-lg font-semibold">AI is creating...</p>
                </div>
            ) : error ? (
                <div className="text-center text-red-400 p-4">
                    <h3 className="font-bold">Error</h3>
                    <p className="text-sm">{error}</p>
                </div>
            ) : formattedImageUrl ? (
                <img src={formattedImageUrl} alt="Formatted for Instagram" className="max-w-full max-h-full object-contain" />
            ) : (
                <div className="text-center text-gray-500">
                    <p>Your formatted image will appear here</p>
                </div>
            )}
        </div>
    </div>
);


interface FooterActionsProps {
    formattedImageUrl: string | null;
    onClear: () => void;
}

const FooterActions: React.FC<FooterActionsProps> = ({ formattedImageUrl, onClear }) => (
    <div className="sticky bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
        <div className="max-w-md mx-auto flex space-x-3">
            <a
                href={formattedImageUrl ?? undefined}
                download="instaframe-ai-image.png"
                className={`flex-1 text-center font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center ${formattedImageUrl ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                onClick={(e) => !formattedImageUrl && e.preventDefault()}
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download
            </a>
            <button
                onClick={onClear}
                disabled={!formattedImageUrl}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
            >
                <ClearIcon className="w-5 h-5 mr-2" />
                Start Over
            </button>
        </div>
    </div>
);


export default function App() {
    const [mode, setMode] = useState<Mode>('upload');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [formattedImageUrl, setFormattedImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('A cute baby sea otter floating on its back');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const processAndSetImage = (imageDataUrl: string) => {
        const image = new Image();
        image.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                setError("Canvas element not found.");
                return;
            };

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError("Could not get canvas context.");
                return;
            };

            const canvasSize = 1080; // Instagram square post size
            canvas.width = canvasSize;
            canvas.height = canvasSize;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            const imageAspectRatio = image.width / image.height;
            let drawWidth, drawHeight;

            const padding = 0.9; // 10% border
            if (imageAspectRatio > 1) { // Landscape
                drawWidth = canvasSize * padding;
                drawHeight = drawWidth / imageAspectRatio;
            } else { // Portrait or square
                drawHeight = canvasSize * padding;
                drawWidth = drawHeight * imageAspectRatio;
            }

            const x = (canvasSize - drawWidth) / 2;
            const y = (canvasSize - drawHeight) / 2;

            ctx.drawImage(image, x, y, drawWidth, drawHeight);
            setFormattedImageUrl(canvas.toDataURL('image/png'));
            setOriginalImage(imageDataUrl);
            setError(null);
            setIsLoading(false);
        };
        image.onerror = () => {
            setError("The file could not be loaded as an image. It might be corrupted or in an unsupported format.");
            setIsLoading(false);
        };
        image.src = imageDataUrl;
    };

    const handleFile = useCallback((file: File | null | undefined) => {
        if (file) {
            // Check if the file is an image. This is a crucial step to prevent errors.
            if (file.type && file.type.startsWith('image/')) {
                setIsLoading(true);
                setError(null);
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        processAndSetImage(reader.result);
                    } else {
                        setError("Failed to read image data.");
                        setIsLoading(false);
                    }
                };
                reader.onerror = () => {
                    setError("Failed to read the selected file.");
                    setIsLoading(false);
                };
                // This is where the error likely occurred. We ensure `file` is a valid File object.
                reader.readAsDataURL(file);
            } else {
                setError("Invalid file type. Please upload an image (e.g., JPEG, PNG, GIF).");
            }
        }
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        handleFile(file);
    };

    const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
        event.preventDefault(); // Necessary to allow drop
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        handleFile(file);
    }, [handleFile]);

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Please enter a prompt to generate an image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setFormattedImageUrl(null);
        setOriginalImage(null);

        try {
            const generatedDataUrl = await generateImage(prompt, aspectRatio);
            processAndSetImage(generatedDataUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during image generation.");
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setOriginalImage(null);
        setFormattedImageUrl(null);
        setError(null);
        setIsLoading(false);
        setPrompt('A cute baby sea otter floating on its back'); // Reset prompt
        
        // Reset file input so user can upload the same file again
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };
    
    const handleModeChange = (newMode: Mode) => {
        if (mode !== newMode) {
            handleClear(); // Clear state when switching modes
        }
        setMode(newMode);
    };


    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
            <Header />
            <ModeSelector mode={mode} setMode={handleModeChange} />
            <main className="flex-grow flex flex-col min-h-0">
                {formattedImageUrl ? (
                    <ImagePreview formattedImageUrl={formattedImageUrl} isLoading={isLoading} error={error} />
                ) : (
                    <>
                        {mode === 'upload' && (
                            <ImageUploader
                                onImageUpload={handleImageUpload}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                isDragging={isDragging}
                            />
                        )}
                        {mode === 'generate' && (
                            <ImageGenerator
                                prompt={prompt}
                                setPrompt={setPrompt}
                                aspectRatio={aspectRatio}
                                setAspectRatio={setAspectRatio}
                                onGenerate={handleGenerate}
                                isLoading={isLoading}
                            />
                        )}
                        <ImagePreview formattedImageUrl={null} isLoading={isLoading} error={error} />
                    </>
                )}
            </main>
            <FooterActions formattedImageUrl={formattedImageUrl} onClear={handleClear} />
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
}
