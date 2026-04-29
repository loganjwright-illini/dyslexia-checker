# Dyslexia Accessibility Checker

A Chrome extension that analyzes any webpage against dyslexia-specific accessibility guidelines. It scores the page and highlights exactly which elements are causing issues.

## Setup

1. **Download the extension**
   - Click the green **Code** button on this page and select **Download ZIP**
   - Unzip the folder somewhere on your computer

2. **Load it into Chrome**
   - Open Chrome and go to `chrome://extensions`
   - Toggle on **Developer mode** in the top right corner
   - Click **Load unpacked**
   - Select the unzipped `dyslexia-checker` folder

3. **Pin the extension** (optional but recommended)
   - Click the puzzle piece icon in the Chrome toolbar
   - Find **Dyslexia Accessibility Checker** and click the pin icon

## How to Use

1. Navigate to any webpage you want to check
2. Click the extension icon in the toolbar
3. View the overall score and the list of checks
4. Click **Highlight Issues on Page** to see exactly which elements are failing — failing elements are outlined in red, warnings in orange, with a label showing which rule is violated
5. Click **Clear Highlights** to remove the outlines

## What It Checks

- Font size (minimum 16px)
- Font family (sans-serif required)
- Line height (minimum 1.5x)
- Italic text
- All-caps text
- Justified text alignment
- Background color (no near-white or pure white)
- Text color (no pure black)
- Image alt text
- Red/green color combinations

## Notes

- The extension does not work on Chrome system pages (`chrome://`) or the Chrome Web Store
- After installing or updating the extension, refresh the page before running a check
- Based on guidelines from the British Dyslexia Association and accessibility research
