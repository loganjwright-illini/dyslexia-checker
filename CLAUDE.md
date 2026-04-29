# Dyslexia Accessibility Checker - Chrome Extension

## Project Purpose
A Chrome extension that analyzes any webpage against dyslexia-specific 
web accessibility guidelines. These guidelines go beyond the standard 
WCAG requirements to address the specific needs of dyslexic users.

## What This Extension Does
- Analyzes the current webpage the user is on
- Checks it against dyslexia specific accessibility guidelines
- Returns a score and detailed feedback for each guideline
- Tells the user what passes, what fails, and why

## Guidelines to Check

### Font Guidelines
- Font Type: Should be sans-serif (Arial, Open Sans, Verdana)
- Font Size: Minimum 18pt (24px) for body text
- Font Emphasis: No italics anywhere on the page
- Character Spacing: Should not be excessively tight or wide
- Font Case: No all caps text anywhere including headings and navigation
- Line Spacing: Minimum 1.5, ideally 2x

### Color Guidelines
- Background Color: Should not be pure white (#FFFFFF). 
  Cream or pastel recommended
- Text Color: Should not be pure black (#000000). 
  Dark grey or navy recommended
- Contrast Ratio: Should not be extremely high (avoid pure black on white) 
  but must remain readable
- No red and green combinations

### Layout Guidelines
- Text Alignment: Should be left aligned, never justified
- Column Width: Maximum 60 characters per line (approximately 600px 
  for 18pt font)
- No multiple columns
- Hyphenation: Should not be present
- Indentation: Should not be used for paragraph separation
- Images: All images should have alt text

### Navigation Guidelines
- No all caps in navigation menus
- Page should have clear heading hierarchy
- Navigation should be consistent

## Technical Implementation Notes

### Files
- manifest.json: Extension configuration and permissions
- popup.html: The UI that appears when extension icon is clicked
- popup.css: Styling for the popup (must follow dyslexia guidelines itself)
- popup.js: Logic for the popup interface
- content.js: Script that runs on the webpage and performs the analysis

### How It Works
1. User clicks extension icon on any webpage
2. popup.js sends a message to content.js
3. content.js analyzes the DOM of the current page
4. Results are sent back to popup.js
5. popup.js displays the results in popup.html

### Checks to Implement
1. Get all text elements and check computed font-size is at least 24px
2. Get body background-color and check it is not pure white
3. Get all text and check font-family includes a sans-serif font
4. Check computed line-height is at least 1.5
5. Check text-align is not justify on any text elements
6. Check for presence of italic text (font-style: italic)
7. Check for all caps text (text-transform: uppercase or all caps content)
8. Check all images have non-empty alt attributes
9. Check contrast ratio between text and background colors
10. Check for red/green color combinations

### Scoring System
Each guideline check should return:
- Pass (green)
- Fail (red) 
- Warning (yellow) for borderline cases

Overall score out of 100 based on number of checks passed

### Important Values
- Minimum font size: 24px (18pt)
- Minimum line height: 1.5, recommended 2.0
- Maximum column width: approximately 600px for body text
- Pure white: #FFFFFF or rgb(255, 255, 255)
- Pure black: #000000 or rgb(0, 0, 0)

## Project Context
This extension was built as part of a class project on dyslexia 
web accessibility. The guidelines are based on research from:
- British Dyslexia Association Style Guide 2023 (Source 10)
- Yoliando 2020 Comparative Study of Dyslexia Style Guides (Source 3)
- Damiano et al. 2019 Testing Web Based Solutions (Source 4)
- McCarthy and Swierenga 2009 Research Review (Source 1)
- Kennecke et al. 2022 Dyslexia and Accessibility Guidelines (Source 6)

## Design Requirements for the Extension Popup Itself
The popup interface must follow the same dyslexia guidelines:
- Use Open Sans or Arial font
- Cream or light pastel background, not pure white
- Dark but not pure black text
- Clear heading hierarchy
- Generous white space
- No all caps
- No italics
- Bold only for emphasis
- Left aligned text