#!/bin/bash
# filepath: c:\workspaces\vtechcom\hydrawallet-sdk\scripts\build-docs.sh

echo "🚀 Starting documentation build process..."

# Pull latest changes from repository
echo "📥 Pulling latest changes from git..."
git pull

# Check if git pull was successful
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Please resolve conflicts and try again."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm i

# Check if pnpm install was successful
if [ $? -ne 0 ]; then
    echo "❌ Package installation failed. Please check your dependencies."
    exit 1
fi

# Generate documentation
echo "📚 Generating documentation..."
pnpm docs:generate

# Check if documentation generation was successful
if [ $? -ne 0 ]; then
    echo "❌ Documentation generation failed. Please check your docs configuration."
    exit 1
fi

echo "✅ Documentation build completed successfully!"
echo "📖 Your documentation is now ready to use."
