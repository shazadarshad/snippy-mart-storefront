import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'; // Using Lucide instead:
import { CloudUpload, FileArchive, CheckCircle2, Loader2, Download as DownloadIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminExtensionUpload() {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.zip')) {
            toast({
                title: 'Invalid format',
                description: 'Please upload a .zip file format.',
                variant: 'destructive',
            });
            return;
        }

        setFileDetails({
            name: file.name,
            size: file.size,
        });

        setIsUploading(true);
        setProgress(10); // Start progress

        try {
            // Upload to Supabase Storage - replace elite-receiver-dist.zip
            setProgress(40);
            
            const { data, error } = await supabase.storage
                .from('extension-artifacts')
                .upload('elite-receiver-dist.zip', file, {
                    cacheControl: '3600',
                    upsert: true, // Replace existing file
                });

            if (error) {
                console.error("Upload error details:", error);
                throw error;
            }

            setProgress(100);
            
            toast({
                title: 'Upload Successful',
                description: 'The extension ZIP has been successfully updated.',
            });
            
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error: any) {
            console.error('Error uploading file:', error);
            
            toast({
                title: 'Upload Failed',
                description: error.message || 'There was an issue uploading the file. Is the storage bucket "extension-artifacts" created and public?',
                variant: 'destructive',
            });
            setFileDetails(null);
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setProgress(0);
            }, 1000); // Keep 100% visible briefly
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const formatSize = (bytes: number) => {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <FileArchive className="w-8 h-8 text-blue-500" />
                    Extension Deployment
                </h1>
                <p className="text-muted-foreground">
                    Upload the latest compiled Chrome extension ZIP file for users to download.
                </p>
            </div>

            <Card className="max-w-3xl p-8 border-dashed border-2 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".zip"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />

                    {!isUploading ? (
                        <>
                            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                                <CloudUpload className="w-12 h-12 text-blue-500" />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold mb-2">Upload Production Build</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Drag and drop your complete extension <span className="font-mono text-sm bg-secondary px-1 py-0.5 rounded">.zip</span> or click to browse. 
                                    This will overwrite the current <span className="font-mono text-sm">elite-receiver-dist.zip</span> available on the download page.
                                </p>
                            </div>

                            <Button 
                                size="lg" 
                                onClick={triggerFileInput}
                                className="mt-4 px-8 font-bold border-2"
                            >
                                <FileArchive className="w-5 h-5 mr-2" />
                                Select ZIP File
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-6 py-8 w-full">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {progress === 100 ? (
                                    <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
                                ) : (
                                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                                )}
                            </div>
                            
                            <div className="w-full max-w-md space-y-2 text-center">
                                <h3 className="font-bold text-lg">
                                    {progress === 100 ? 'Upload Complete!' : 'Deploying to Cloud...'}
                                </h3>
                                
                                {fileDetails && (
                                    <p className="text-sm text-muted-foreground">
                                        {fileDetails.name} • {formatSize(fileDetails.size)}
                                    </p>
                                )}
                                
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-4">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                                        style={{ width: progress + '%' }}
                                    ></div>
                                </div>
                                <p className="text-xs font-mono text-muted-foreground pt-2">
                                    {progress}%
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="flex items-center gap-4 text-sm text-muted-foreground max-w-3xl bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <DownloadIcon className="w-5 h-5 text-blue-500 shrink-0" />
                <p>
                    <strong>Public Download Link:</strong> Users will immediately start receiving this new version when they visit the <a href="/download-extension" target="_blank" className="underline text-blue-500 font-medium">download page</a>.
                </p>
            </div>
        </div>
    );
}
