import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';

import { AspectRatio } from './types';
import { generateImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, DownloadIcon, ClearIcon, CropIcon } from './components/icons';

type Mode = 'upload' | 'generate';

interface ImageState {
    id: string;
    originalSrc: string;
    formattedSrc: string;
}

const aspectRatios: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const cropAspectRatios: { label: string; value: number | undefined }[] = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 / 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
];

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
            <span className="text-lg">Choose photos</span>
            <span className="text-xs text-gray-500">or drag and drop</span>
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={onImageUpload} multiple />
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
    images: ImageState[];
    isLoading: boolean;
    error: string | null;
    onCrop: (id: string) => void;
    currentImageIndex: number;
    setCurrentImageIndex: (index: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images, isLoading, error, onCrop, currentImageIndex, setCurrentImageIndex }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            if (index !== currentImageIndex) {
                setCurrentImageIndex(index);
            }
        }
    }, [currentImageIndex, setCurrentImageIndex]);
    
    useEffect(() => {
        const scroller = scrollContainerRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    return (
        <div className="flex-grow flex items-center justify-center p-4 min-h-0">
            <div className="w-full max-w-md aspect-square bg-black rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 shadow-lg relative">
                {isLoading && images.length === 0 ? (
                    <div className="flex flex-col items-center text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                        <p className="mt-4 text-lg font-semibold">Processing images...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 p-4">
                        <h3 className="font-bold">Error</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                ) : images.length > 0 ? (
                    <div ref={scrollContainerRef} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`::-webkit-scrollbar { display: none; }`}</style>
                        {images.map((image, index) => (
                            <div key={image.id} className="w-full h-full flex-shrink-0 snap-center flex flex-col items-center justify-center p-2">
                                <img src={image.formattedSrc} alt={`Formatted image ${index + 1}`} className="max-w-full max-h-[calc(100%-4.5rem)] object-contain" />
                                <div className="flex items-center space-x-3 mt-4">
                                    <button onClick={() => onCrop(image.id)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 flex items-center text-sm">
                                        <CropIcon className="w-4 h-4 mr-2" />
                                        Crop
                                    </button>
                                    <a
                                        href={image.formattedSrc}
                                        download={`instaframe-ai-image-${index + 1}.png`}
                                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 flex items-center text-sm"
                                    >
                                        <DownloadIcon className="w-4 h-4 mr-2" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p>Your formatted images will appear here</p>
                    </div>
                )}
                {images.length > 1 && (
                    <div className="absolute bottom-2 right-3 bg-gray-900/50 text-white text-xs font-mono rounded-full px-2 py-1 select-none">
                        {currentImageIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
};

interface FooterActionsProps {
    hasImages: boolean;
    onClear: () => void;
}

const FooterActions: React.FC<FooterActionsProps> = ({ hasImages, onClear }) => (
    <div className="sticky bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
        <div className="max-w-md mx-auto flex space-x-3">
            <button
                onClick={onClear}
                disabled={!hasImages}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
            >
                <ClearIcon className="w-5 h-5 mr-2" />
                Start Over
            </button>
        </div>
    </div>
);

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context for cropping.');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/png');
}


export default function App() {
    const [mode, setMode] = useState<Mode>('upload');
    const [images, setImages] = useState<ImageState[]>([]);
    const [prompt, setPrompt] = useState<string>('A cute baby sea otter floating on its back');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Cropping State
    const [croppingImage, setCroppingImage] = useState<ImageState | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [cropAspectRatio, setCropAspectRatio] = useState<number | undefined>(undefined);
    const imgRef = useRef<HTMLImageElement>(null);

    const addBorderToImage = useCallback((imageDataUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return reject(new Error("Canvas element not found."));
                
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context."));

                const canvasSize = 1080;
                canvas.width = canvasSize;
                canvas.height = canvasSize;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvasSize, canvasSize);

                const imageAspectRatio = image.width / image.height;
                const padding = 0.9;
                let drawWidth = image.width > image.height ? canvasSize * padding : (canvasSize * padding) * imageAspectRatio;
                let drawHeight = image.width > image.height ? (canvasSize * padding) / imageAspectRatio : canvasSize * padding;

                const x = (canvasSize - drawWidth) / 2;
                const y = (canvasSize - drawHeight) / 2;

                ctx.drawImage(image, x, y, drawWidth, drawHeight);
                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = () => reject(new Error("The image file could not be loaded."));
            image.src = imageDataUrl;
        });
    }, []);

    const processAndAddImages = useCallback(async (imageDataUrls: string[]) => {
        try {
            const newImages: ImageState[] = await Promise.all(
                imageDataUrls.map(async (url) => {
                    const formattedSrc = await addBorderToImage(url);
                    return {
                        id: self.crypto.randomUUID(),
                        originalSrc: url,
                        formattedSrc,
                    };
                })
            );
            setImages(prev => [...prev, ...newImages]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during image processing.");
        }
    }, [addBorderToImage]);

    const readSingleFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read the selected file."));
            reader.readAsDataURL(file);
        });
    };

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsLoading(true);
        setError(null);
        setImages([]);
        setCurrentImageIndex(0);

        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setError("No valid image files selected.");
            setIsLoading(false);
            return;
        }

        try {
            const imageDataUrls = await Promise.all(imageFiles.map(readSingleFile));
            await processAndAddImages(imageDataUrls);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during image processing.");
        } finally {
            setIsLoading(false);
        }
    }, [processAndAddImages]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => { handleFiles(event.target.files); event.target.value = ''; };
    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }, [handleFiles]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedDataUrl = await generateImage(prompt, aspectRatio);
            await processAndAddImages([generatedDataUrl]);
            setCurrentImageIndex(images.length);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error during generation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => { setImages([]); setError(null); setIsLoading(false); setCurrentImageIndex(0); setPrompt('A cute baby sea otter floating on its back'); };
    const handleModeChange = (newMode: Mode) => { if (mode !== newMode) handleClear(); setMode(newMode); };
    
    const handleCropClick = (id: string) => {
        const imageToCrop = images.find(img => img.id === id);
        if (imageToCrop) {
            setCroppingImage(imageToCrop);
            setCropAspectRatio(undefined);
            setCrop(undefined); // Reset crop on open
        }
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                cropAspectRatio || width / height,
                width,
                height
            ),
            width,
            height
        );
        setCrop(newCrop);
    }
    
    const handleApplyCrop = async () => {
        if (!croppingImage || !completedCrop || !imgRef.current) return;
        
        if (completedCrop.width === 0 || completedCrop.height === 0) {
             setCroppingImage(null);
             return;
        }

        setIsLoading(true);
        try {
            const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
            const newlyFormattedUrl = await addBorderToImage(croppedImageUrl);
            setImages(prevImages => prevImages.map(img => 
                img.id === croppingImage.id 
                ? { ...img, formattedSrc: newlyFormattedUrl, originalSrc: croppedImageUrl } 
                : img
            ));
            setCroppingImage(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to apply crop.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (imgRef.current) {
            onImageLoad({ currentTarget: imgRef.current } as React.SyntheticEvent<HTMLImageElement>);
        }
    }, [cropAspectRatio]);

    return (
        <>
            <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
                <Header />
                <ModeSelector mode={mode} setMode={handleModeChange} />
                <main className="flex-grow flex flex-col min-h-0">
                    {images.length > 0 ? (
                        <ImagePreview images={images} isLoading={isLoading} error={error} onCrop={handleCropClick} currentImageIndex={currentImageIndex} setCurrentImageIndex={setCurrentImageIndex} />
                    ) : (
                        <>
                            {mode === 'upload' && <ImageUploader onImageUpload={handleImageUpload} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} isDragging={isDragging} />}
                            {mode === 'generate' && <ImageGenerator prompt={prompt} setPrompt={setPrompt} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} onGenerate={handleGenerate} isLoading={isLoading} />}
                            <ImagePreview images={[]} isLoading={isLoading} error={error} onCrop={()=>{}} currentImageIndex={0} setCurrentImageIndex={()=>{}} />
                        </>
                    )}
                </main>
                <FooterActions hasImages={images.length > 0} onClear={handleClear} />
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            {croppingImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col p-4 backdrop-blur-sm">
                    <div className="relative flex-grow flex items-center justify-center">
                       <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={cropAspectRatio}
                            className="max-h-full"
                        >
                            <img
                                ref={imgRef}
                                src={croppingImage.originalSrc}
                                onLoad={onImageLoad}
                                style={{ maxHeight: '70vh', objectFit: 'contain' }}
                                alt="Image to crop"
                            />
                        </ReactCrop>
                    </div>
                    <div className="py-4 space-y-4">
                         <div className="space-y-2">
                            <label className="block text-center text-sm font-medium text-gray-400">Crop Aspect Ratio</label>
                            <div className="flex justify-center flex-wrap gap-2 px-4">
                                {cropAspectRatios.map(({ label, value }) => (
                                    <button
                                        key={label}
                                        onClick={() => setCropAspectRatio(value)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                                            cropAspectRatio === value
                                                ? 'bg-pink-600 text-white shadow-lg'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => setCroppingImage(null)} className="px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors">Cancel</button>
                            <button onClick={handleApplyCrop} className="px-8 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors">Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
