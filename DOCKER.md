# Docker Deployment Guide

This guide explains how to build and run the CapBO Angular application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for multi-service setup)

## Building the Docker Image

### Option 1: Using Docker directly

```bash
# Build the image
docker build -t capbo-frontend .

# Run the container
docker run -d -p 80:80 --name capbo-app capbo-frontend
```

### Option 2: Using Docker Compose

```bash
# Build and start the application
docker-compose up -d

# Stop the application
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Accessing the Application

Once the container is running, you can access the application at:
- http://localhost (if using port 80)
- http://localhost:8080 (if you changed the port mapping)

## Docker Image Details

### Multi-stage Build

The Dockerfile uses a multi-stage build approach:

1. **Build Stage**: Uses Node.js 18 Alpine to build the Angular application
2. **Production Stage**: Uses Nginx Alpine to serve the static files

### Features

- **Optimized Size**: Multi-stage build reduces final image size
- **Production Ready**: Nginx configuration optimized for Angular SPA
- **API Proxy**: Pre-configured proxy for `/api/` routes to backend service
- **Security**: Runs as non-root user in production

## Configuration

### Environment Variables

You can customize the application using environment variables:

```bash
# Example with environment variables
docker run -d -p 80:80 \
  -e NODE_ENV=production \
  -e API_URL=http://your-backend:8080 \
  --name capbo-app capbo-frontend
```

### Custom Nginx Configuration

To use a custom nginx configuration:

1. Create your `nginx.conf` file
2. Uncomment the COPY line in the Dockerfile
3. Rebuild the image

### Backend Integration

The nginx configuration includes a proxy for API calls:
- Frontend routes: served by nginx
- `/api/*` routes: proxied to `http://backend:8080`

To connect with a backend service, ensure:
1. Backend service is named `backend` in docker-compose
2. Backend exposes port 8080
3. Both services are on the same Docker network

## Development vs Production

### Development
```bash
# For development, use the Angular dev server
npm start
# or
ng serve --port 4201
```

### Production
```bash
# Use Docker for production deployment
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change the port mapping
   docker run -d -p 8080:80 --name capbo-app capbo-frontend
   ```

2. **Build fails**
   ```bash
   # Clean Docker cache and rebuild
   docker system prune -f
   docker build --no-cache -t capbo-frontend .
   ```

3. **Application not loading**
   - Check if container is running: `docker ps`
   - Check container logs: `docker logs capbo-app`
   - Verify port mapping and firewall settings

### Logs

```bash
# View application logs
docker logs capbo-app

# Follow logs in real-time
docker logs -f capbo-app

# Using docker-compose
docker-compose logs frontend
```

## Security Considerations

- The application runs on port 80 inside the container
- Nginx is configured with security headers
- No sensitive information is included in the image
- Use environment variables for configuration

## Performance Optimization

- Gzip compression enabled in nginx
- Static assets cached appropriately
- Multi-stage build minimizes image size
- Alpine Linux base images for smaller footprint