import React, { useState } from 'react';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { client, endpoints } from '@/api/client';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';

const fetcher = (url: string) => client.get(url).then(res => res.data);

export const Dashboard = () => {
  const { data: albums, error, mutate } = useSWR(endpoints.albums.list, fetcher);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post(endpoints.albums.create, { name: newAlbumName });
      mutate();
      setIsCreateModalOpen(false);
      setNewAlbumName('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Albums</h2>
          <p className="text-muted-foreground mt-1">Manage your photo collections</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <AddIcon className="mr-2" fontSize="small" />
          New Album
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums?.map((album: any) => (
          <Link 
            key={album.id} 
            to={`/admin/albums/${album.id}`}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center overflow-hidden">
              {album.cover_image_url ? (
                <img 
                  src={album.cover_image_url} 
                  alt={album.name} 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <FolderIcon className="text-muted-foreground/20 h-16 w-16" style={{ fontSize: 64 }} />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium truncate">{album.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{album.image_count} items</p>
            </div>
          </Link>
        ))}
      </div>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New Album"
      >
        <form onSubmit={handleCreateAlbum} className="space-y-4">
          <Input 
            label="Album Name" 
            placeholder="e.g. Summer 2024" 
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Album'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
