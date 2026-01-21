import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { client, endpoints } from '@/api/client';
import useSWR from 'swr';
import { useDropzone } from 'react-dropzone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ShareIcon from '@mui/icons-material/Share';

const fetcher = (url: string) => client.get(url).then(res => res.data);

export const AlbumView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: album } = useSWR(id ? endpoints.albums.get(id) : null, fetcher);
  const { data: images, mutate } = useSWR(id ? endpoints.images.list(id) : null, fetcher);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!id) return;
    setUploading(true);

    // Process files sequentially or in parallel batches
    for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('album_id', id);

        try {
            await client.post(endpoints.images.upload, formData, {
                onUploadProgress: (progressEvent) => {
                    const percent = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
                    setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
                }
            });
        } catch (error) {
            console.error(`Failed to upload ${file.name}`, error);
        }
    }
    
    setUploading(false);
    setUploadProgress({});
    mutate();
  }, [id, mutate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  });

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const res = await client.post(endpoints.shares.create, {
        album_id: id,
        password: sharePassword || undefined
      });
      // Construct full URL - assuming current origin for now + /share/token
      const link = `${window.location.origin}/share/${res.data.share_link}`;
      setShareLink(link);
    } catch (err) {
      console.error(err);
    }
  };

  if (!album) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="mb-4 pl-0 hover:pl-0 hover:bg-transparent hover:text-primary">
          <ArrowBackIcon fontSize="small" className="mr-2" />
          Back to Albums
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-bold tracking-tight">{album.name}</h1>
             <p className="text-muted-foreground mt-1">{images?.length || 0} photos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsShareModalOpen(true)}>
              <ShareIcon fontSize="small" className="mr-2" />
              Share
            </Button>
            {/* Upload Trigger could be here too, but dropzone is better */}
          </div>
        </div>
      </div>

      <div {...getRootProps()} className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <CloudUploadIcon style={{ fontSize: 40 }} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag & drop images here, or click to select files</p>
          )}
        </div>
        {uploading && (
             <div className="mt-4 text-sm text-left max-w-md mx-auto">
                 <p className="mb-2 font-medium text-foreground">Uploading...</p>
                 {Object.entries(uploadProgress).map(([name, progress]) => (
                     <div key={name} className="flex items-center justify-between text-xs mb-1">
                         <span className="truncate w-40">{name}</span>
                         <span>{progress}%</span>
                     </div>
                 ))}
             </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images?.map((image: any) => (
          <div key={image.id} className="aspect-square relative group overflow-hidden rounded-md bg-muted">
            <img 
              src={image.url_thumbnail} 
              alt={image.original_filename}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white text-xs truncate w-full">{image.original_filename}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setShareLink(null); setSharePassword(''); }}
        title="Share Album"
      >
        {!shareLink ? (
            <form onSubmit={handleCreateShare} className="space-y-4">
                <Input 
                    label="Password (Optional)"
                    type="password"
                    placeholder="Leave empty for public link"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                />
                <Button type="submit" className="w-full">
                    Generate Link
                </Button>
            </form>
        ) : (
            <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md break-all text-sm font-mono">
                    {shareLink}
                </div>
                <Button 
                    className="w-full" 
                    onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        // Could show toast here
                    }}
                >
                    Copy Link
                </Button>
            </div>
        )}
      </Modal>
    </Layout>
  );
};
