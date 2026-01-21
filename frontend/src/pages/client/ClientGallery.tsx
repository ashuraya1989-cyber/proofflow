import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { client, endpoints } from '@/api/client';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import useSWR from 'swr';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Access Control Component
const AccessGate = ({ onAccess }: { onAccess: (pwd: string) => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAccess(password);
    } catch (err) {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Protected Album</h1>
        <p className="text-muted-foreground">Please enter the password to view this album.</p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <Button type="submit" className="w-full">Access Album</Button>
        </form>
      </div>
    </div>
  );
};

export const ClientGallery = () => {
  const { token } = useParams<{ token: string }>();
  const [access, setAccess] = useState<{ status: 'loading' | 'auth_required' | 'authorized' | 'error' }>({ status: 'loading' });
  const [albumData, setAlbumData] = useState<any>(null);
  const [password, setPassword] = useState<string | null>(null);
  
  // Images fetching
  const { data: images } = useSWR(
    access.status === 'authorized' && albumData ? endpoints.images.list(albumData.id) : null,
    (url) => client.get(url).then(res => res.data)
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    
    // Initial validation
    client.post(endpoints.shares.validate(token))
      .then(res => {
         setAlbumData(res.data.album);
         setAccess({ status: 'authorized' });
      })
      .catch(err => {
         if (err.response?.status === 401 || err.response?.status === 403) {
            setAccess({ status: 'auth_required' });
         } else {
            setAccess({ status: 'error' });
         }
      });
  }, [token]);

  const handleAccess = async (pwd: string) => {
    if (!token) return;
    try {
        const res = await client.post(endpoints.shares.validate(token), { password: pwd });
        setAlbumData(res.data.album);
        setPassword(pwd);
        setAccess({ status: 'authorized' });
    } catch (err) {
        throw err;
    }
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && images && lightboxIndex < images.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
    }
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
    }
  };

  if (access.status === 'loading') return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (access.status === 'error') return <div className="min-h-screen flex items-center justify-center">Link invalid or expired</div>;
  if (access.status === 'auth_required') return <AccessGate onAccess={handleAccess} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-8">
           <span className="font-bold mr-4">{albumData?.name}</span>
           <span className="text-sm text-muted-foreground">{images?.length || 0} photos</span>
        </div>
      </header>

      <main className="container p-8 mx-auto">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {images?.map((image: any, idx: number) => (
                <div 
                    key={image.id} 
                    className="break-inside-avoid relative group cursor-zoom-in rounded-lg overflow-hidden bg-muted"
                    onClick={() => setLightboxIndex(idx)}
                >
                    <img 
                        src={image.url_thumbnail} 
                        alt={image.original_filename}
                        className="w-full h-auto object-cover transition-opacity hover:opacity-90"
                        loading="lazy"
                    />
                </div>
            ))}
        </div>
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && images && (
          <div 
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
              <button 
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground z-50"
                onClick={() => setLightboxIndex(null)}
              >
                  <CloseIcon fontSize="large" />
              </button>

              <button
                className="absolute left-4 p-4 text-muted-foreground hover:text-foreground disabled:opacity-20 z-50"
                onClick={showPrev}
                disabled={lightboxIndex === 0}
              >
                  <ArrowBackIosNewIcon fontSize="large" />
              </button>

              <div className="relative max-h-screen w-full h-full p-4 flex items-center justify-center">
                  <img 
                    src={images[lightboxIndex].url_display}
                    alt={images[lightboxIndex].original_filename}
                    className="max-h-full max-w-full object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                  />
              </div>

              <button
                className="absolute right-4 p-4 text-muted-foreground hover:text-foreground disabled:opacity-20 z-50"
                onClick={showNext}
                disabled={lightboxIndex === images.length - 1}
              >
                  <ArrowForwardIosIcon fontSize="large" />
              </button>
          </div>
      )}
    </div>
  );
};
