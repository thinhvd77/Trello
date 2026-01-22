#!/bin/bash
# ============================================
# EC2 Setup Script for Trello Clone
# Amazon Linux 2023 / Amazon Linux 2
# ============================================

set -e

echo "🚀 Starting Trello Clone EC2 Setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18.x (LTS)
echo "📦 Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install build essentials for native modules (better-sqlite3)
echo "📦 Installing build tools..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Create application directory
APP_DIR="/var/www/trello-clone"
echo "📁 Creating application directory at ${APP_DIR}..."
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}

# Note: You need to copy your application files to this directory
echo ""
echo "⚠️  IMPORTANT: Copy your application files to ${APP_DIR}"
echo "   You can use scp or git clone to do this."
echo ""

# Setup nginx configuration
echo "⚙️  Configuring Nginx..."
sudo cp /var/www/trello-clone/deploy/nginx.conf /etc/nginx/conf.d/trello-clone.conf

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup PM2 startup script
echo "⚙️  Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME

# Navigate to app directory and install dependencies
cd ${APP_DIR}

if [ -f "package.json" ]; then
    echo "📦 Installing application dependencies..."
    npm install --production
    
    # Start application with PM2
    echo "🚀 Starting application with PM2..."
    pm2 start server.js --name "trello-clone"
    pm2 save
else
    echo "⚠️  No package.json found. Please copy your application files first."
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload 2>/dev/null || true

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Copy your application files to ${APP_DIR}"
echo "2. Run: cd ${APP_DIR} && npm install"
echo "3. Run: pm2 start server.js --name trello-clone"
echo "4. Access your app at http://YOUR_EC2_PUBLIC_IP"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View app logs"
echo "  pm2 restart all     - Restart app"
echo "  sudo systemctl status nginx - Check nginx status"
echo ""
