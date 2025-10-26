#!/bin/bash

# Bird Buddy Deployment Helper Script

echo "🐦 Bird Buddy Deployment Helper"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the bird-buddy root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "✅ No .env.local needed - BirdWeather API is public!"
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Bird Buddy app"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 No GitHub remote found. Please:"
    echo "1. Create a new repository on GitHub"
    echo "2. Add it as origin: git remote add origin https://github.com/yourusername/bird-buddy.git"
    echo "3. Push your code: git push -u origin main"
    echo ""
    read -p "Press Enter when ready..."
fi

echo "✅ Ready for deployment!"
echo ""
echo "🚀 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Sign up with GitHub"
echo "3. Click 'New Project'"
echo "4. Import your repository"
echo "5. Click 'Deploy' (no environment variables needed!)"
echo ""
echo "🎉 Your demo will be live in ~2 minutes!"
