# Gallery

A modern, full-stack photo gallery and client sharing application built with React, FastAPI, and MongoDB.

## Features

### Admin UI
- **Album Management**: Create albums and subfolders for organizing photos
- **Bulk Upload**: Upload multiple images with per-file progress tracking
- **Image Viewer**: Full-screen viewer with zoom, navigation, and keyboard shortcuts
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Client Sharing**: Generate password-protected links for clients

### Client Gallery
- **Password Protection**: Secure access with custom passwords
- **High-Quality Images**: Original resolution images for client viewing
- **Full-Screen Viewer**: Navigate through images with keyboard or touch
- **Download Support**: Clients can download individual images

### Technical
- **Resolution Handling**: Automatic generation of thumbnails (400px), medium (1200px), and original
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI/UX**: Cursor-inspired design system with smooth transitions

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gallery
```

2. Create your environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and set secure values:
```env
SECRET_KEY=your-secure-random-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
FRONTEND_URL=http://your-domain.com
BASE_URL=http://your-domain.com
```

4. Start the application:
```bash
docker-compose up -d
```

5. Access the admin panel at `http://localhost` and login with your configured credentials.

## Development Setup

### Backend Only (with local frontend)

1. Start MongoDB and backend:
```bash
docker-compose -f docker-compose.dev.yml up
```

2. Start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

3. Access the app at `http://localhost:5173`

### Full Local Development

If you want to run everything locally without Docker:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**MongoDB:**
- Install MongoDB locally or use a cloud instance
- Update `MONGODB_URL` in your environment

## Architecture

```
gallery/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Design system components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   └── client/      # Client gallery components
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand state management
│   │   ├── api/             # API client layer
│   │   └── hooks/           # Custom React hooks
│   └── Dockerfile
├── backend/                  # FastAPI + Motor (async MongoDB)
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic
│   │   └── core/            # Config, security, database
│   └── Dockerfile
├── docker-compose.yml        # Production configuration
└── docker-compose.dev.yml    # Development configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Albums
- `GET /api/albums` - List albums
- `POST /api/albums` - Create album
- `GET /api/albums/{id}` - Get album details
- `PATCH /api/albums/{id}` - Update album
- `DELETE /api/albums/{id}` - Delete album

### Images
- `POST /api/images/upload/{album_id}` - Upload image
- `GET /api/images/album/{album_id}` - List album images
- `GET /api/images/{id}/thumbnail` - Get thumbnail (400px)
- `GET /api/images/{id}/medium` - Get medium resolution (1200px)
- `GET /api/images/{id}/original` - Get original resolution
- `DELETE /api/images/{id}` - Delete image

### Shares
- `POST /api/shares` - Create share link
- `GET /api/shares` - List shares
- `DELETE /api/shares/{id}` - Delete share

### Client (Public)
- `GET /api/client/share/{token}` - Get share info
- `POST /api/client/share/{token}/access` - Validate password
- `GET /api/client/gallery/{token}/images` - Get gallery images

## Design Decisions

### UI/UX Philosophy
The admin interface follows a **Cursor-inspired design language**:

1. **Visual Hierarchy**: Calm, confident layouts with subtle contrast
2. **Spacing**: Consistent 4px-based spacing system
3. **Typography**: Inter font family for optimal readability
4. **Interactions**: Subtle transitions, no flashy animations
5. **Focus States**: Clear but not harsh indicators
6. **Color Palette**: Neutral grays with blue accent

### Image Resolution Strategy
- **Thumbnails (400x400)**: Used in grid views for fast loading
- **Medium (1200x1200)**: Used for admin preview
- **Original**: Preserved at full quality for client downloads

This approach solves the pixelation issue by ensuring:
- Grid views always use appropriately-sized thumbnails
- Client galleries receive original resolution images
- No upscaling ever occurs

### Album Structure
- Albums can contain images and subfolders
- No "Root" folder concept - top-level albums are the root
- "All" view aggregates images from album and all descendants
- Share links can include or exclude subfolders

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing key | (required) |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin` |
| `FRONTEND_URL` | Public frontend URL | `http://localhost` |
| `BASE_URL` | Public backend URL | `http://localhost` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://mongodb:27017` |
| `MONGODB_DB_NAME` | Database name | `gallery` |
| `DEBUG` | Enable debug mode | `false` |

## Data Storage

- **Images**: Stored in Docker volume `uploads` at `/app/uploads`
- **Database**: MongoDB data in Docker volume `mongodb_data`

To backup your data:
```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /dump

# Backup uploads
docker cp gallery-backend-1:/app/uploads ./uploads-backup
```

## Troubleshooting

### Images not loading
1. Check that the backend is running: `docker-compose logs backend`
2. Verify MongoDB is healthy: `docker-compose logs mongodb`
3. Check browser console for authentication errors

### Upload fails
1. Check file size (max 50MB per file)
2. Check file format (JPG, PNG, GIF, WebP only)
3. Check backend logs for errors

### Share links not working
1. Verify `FRONTEND_URL` is set correctly in `.env`
2. Check that the share is active and not expired
3. Verify the password matches

## License

MIT License - See LICENSE file for details.
