#!/usr/bin/env bash
# Save remote icon images into assets/ for local use
set -euo pipefail
mkdir -p assets

echo "Downloading settings icon..."
curl -L -o assets/settings-icon.png "https://images.vexels.com/media/users/3/143276/isolated/preview/98336182a8a47d620c44bc80a1a4abdc-cog-wheel.png"

echo "Downloading images icon..."
curl -L -o assets/images-icon.png "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLvwmXlstUSTVmA0C2KWphEIlqJr1mk3ySrQ&s"

echo "Done. Files saved to assets/"
