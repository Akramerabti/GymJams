#!/bin/bash

# This script moves your video from Git LFS to regular Git storage
# WARNING: This will increase your repo size significantly

echo "Removing coaching_preview.mp4 from Git LFS..."

# Remove from Git LFS tracking
git rm --cached client/public/coaching_preview.mp4

# Remove the LFS rule for this specific file
# First, let's backup the original .gitattributes
cp .gitattributes .gitattributes.backup

# Remove the mp4 LFS rule (you can add it back for other mp4 files later)
grep -v "*.mp4 filter=lfs diff=lfs merge=lfs -text" .gitattributes > .gitattributes.tmp
mv .gitattributes.tmp .gitattributes

# Add the file back to regular Git
git add client/public/coaching_preview.mp4
git add .gitattributes

echo "Now commit these changes:"
echo "git commit -m 'Move coaching_preview.mp4 from Git LFS to regular Git'"
echo ""
echo "WARNING: This will make your repo larger, but will fix the Vercel deployment issue."
