# AIF Baring Deployment Guide - Ubuntu + Nginx

## Problem Fixed
- ✅ **MIME Type Error**: "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of text/html"
- ✅ **Build Optimization**: Reduced build time and bundle size
- ✅ **Performance**: Added caching, gzip compression, and code splitting

---

## Prerequisites
- Ubuntu Server (18.04+)
- Nginx installed: `sudo apt-get install nginx`
- Node.js & npm installed
- Domain: `staging-ext-bpepindia.aifmetrics.com`

---

## Step 1: Build the Application (Faster Build)

The optimizations are already in `angular.json`. Build with:

```bash
cd aifm-baring

# Install dependencies (only first time)
npm install

# Build for production (now faster with optimizations)
npm run build:production
# or
npm run build:staging
```

**Build Time Improvements:**
- Disabled `namedChunks` (was enabled) → Smaller bundle filenames
- Enabled `buildOptimizer` → Better tree-shaking
- Set `vendorChunk: false` → Reduced vendor bundle
- Optimized font handling → Smaller CSS

**Expected build time:** 2-4 minutes (depends on your machine)

---

## Step 2: Setup Nginx Configuration

### Option A: Automatic Setup (Recommended)

```bash
# Copy the provided nginx configuration
sudo cp aifm-baring/nginx.conf /etc/nginx/sites-available/aif-baring

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/aif-baring /etc/nginx/sites-enabled/aif-baring

# Disable default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Option B: Manual Configuration

If you need custom paths or SSL certificates:

1. Edit `/etc/nginx/sites-available/aif-baring`
2. Update these paths:
   - `ssl_certificate` - Path to your SSL cert
   - `ssl_certificate_key` - Path to your SSL key
   - `root` - Path to your build output (default: `/var/www/aif-baring/html`)

---

## Step 3: Deploy Build Output

```bash
# Create deployment directory
sudo mkdir -p /var/www/aif-baring/html

# Copy build output to nginx root
sudo cp -r aifm-baring-frontend-binaries/html/* /var/www/aif-baring/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/aif-baring
sudo chmod -R 755 /var/www/aif-baring

# Verify files
ls -la /var/www/aif-baring/html/
```

---

## Step 4: SSL Certificate Setup

### Using Let's Encrypt (Free & Automatic)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d staging-ext-bpepindia.aifmetrics.com

# Certificates will be at:
# /etc/letsencrypt/live/staging-ext-bpepindia.aifmetrics.com/
```

Update `nginx.conf` with correct paths:
```nginx
ssl_certificate /etc/letsencrypt/live/staging-ext-bpepindia.aifmetrics.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/staging-ext-bpepindia.aifmetrics.com/privkey.pem;
```

### Using Your Own Certificate

```bash
# Place your certificate and key in:
sudo cp your-cert.crt /etc/ssl/certs/staging-ext-bpepindia.aifmetrics.com.crt
sudo cp your-key.key /etc/ssl/private/staging-ext-bpepindia.aifmetrics.com.key

# Set permissions
sudo chmod 644 /etc/ssl/certs/staging-ext-bpepindia.aifmetrics.com.crt
sudo chmod 600 /etc/ssl/private/staging-ext-bpepindia.aifmetrics.com.key
```

---

## Step 5: Test Deployment

### 1. Check Nginx Status
```bash
sudo systemctl status nginx
```

### 2. Verify MIME Types Are Correct
```bash
# Test .js file (should return application/javascript)
curl -I https://staging-ext-bpepindia.aifmetrics.com/main.js | grep Content-Type

# Test .css file (should return text/css)
curl -I https://staging-ext-bpepindia.aifmetrics.com/styles.css | grep Content-Type
```

### 3. Check Browser Console
- Open: `https://staging-ext-bpepindia.aifmetrics.com/`
- Press `F12` (Developer Tools)
- Check **Console** tab for errors
- Check **Network** tab for failed requests
- Look for "Failed to load module script" errors (should be GONE)

### 4. Test Gzip Compression
```bash
curl -I -H "Accept-Encoding: gzip" https://staging-ext-bpepindia.aifmetrics.com/ | grep Content-Encoding
```
Should show: `Content-Encoding: gzip`

---

## Troubleshooting

### Error: "Failed to load module script"
**Cause**: Nginx serving wrong MIME type

**Solution**:
```bash
# Reload nginx configuration
sudo systemctl reload nginx

# Verify MIME types in nginx
curl -I https://staging-ext-bpepindia.aifmetrics.com/main.js
```

### Error: 404 on page refresh
**Cause**: SPA routing not configured

**Solution**: Already fixed in `nginx.conf` with:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Build Size Still Large
**Cause**: CommonJS dependencies not tree-shaken

**Solution**: 
```bash
# Analyze bundle
ng build --stats-json
npm install webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/main.js
```

### Slow Build Time
**Check if parallelization is enabled:**
```bash
# Use more CPU cores
export NG_BUILD_CACHE_DISABLED=false
npm run build:production
```

---

## Performance Monitoring

### Monitor Nginx Access
```bash
sudo tail -f /var/log/nginx/access.log
```

### Monitor Nginx Errors
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Disk Usage
```bash
du -sh /var/www/aif-baring/html/
```

### Check Memory Usage
```bash
free -h
```

---

## Continuous Deployment

### Create Deployment Script

Create `/home/ubuntu/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building application..."
cd /home/ubuntu/aifm-baring
npm run build:production

echo "📦 Copying build output..."
sudo cp -r aifm-baring-frontend-binaries/html/* /var/www/aif-baring/html/

echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 App available at: https://staging-ext-bpepindia.aifmetrics.com/"
```

Make it executable:
```bash
chmod +x /home/ubuntu/deploy.sh
```

Run it:
```bash
./deploy.sh
```

---

## Automatic Certificate Renewal (Let's Encrypt)

Certbot auto-renews, but verify:
```bash
sudo certbot renew --dry-run
```

If issues, manually renew:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Summary of Optimizations

| Change | Impact | Status |
|--------|--------|--------|
| Fixed MIME type error | Resolves module load failures | ✅ Done |
| Disabled namedChunks | Smaller bundle | ✅ Done |
| Enabled buildOptimizer | Better tree-shaking | ✅ Done |
| Added gzip compression | 70-80% smaller responses | ✅ Done |
| Added asset caching | Faster repeat visits | ✅ Done |
| Lazy loading ready | Reduce initial bundle | ⏳ Optional |

---

## Next Steps (Optional Optimizations)

1. **Implement Lazy Loading**: Add route-based code splitting
2. **Add Service Worker**: Offline support + caching
3. **Image Optimization**: Convert to WebP format
4. **Monitor Performance**: Setup Sentry or similar
5. **CDN**: Cache static assets on CloudFront/Cloudflare

---

## Support

For issues:
1. Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
2. Verify MIME types: `curl -I https://staging-ext-bpepindia.aifmetrics.com/main.js`
3. Check browser console for errors
4. Verify file permissions: `ls -la /var/www/aif-baring/html/`
