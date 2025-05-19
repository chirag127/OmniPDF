/**
 * Asset Generation Script
 * 
 * This script converts SVG files to PNG format using the sharp library.
 * It reads SVG files from the frontend/src/assets directory and generates
 * corresponding PNG files in the same directory.
 * 
 * Usage:
 * - Place SVG files in the frontend/src/assets directory
 * - Run this script using: node scripts/generate-assets.js
 * - PNG files will be generated in the frontend/src/assets directory
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const assetsDir = path.join(__dirname, '../frontend/src/assets');
const svgDir = path.join(assetsDir);
const pngDir = path.join(assetsDir);

// Create directories if they don't exist
if (!fs.existsSync(pngDir)) {
  fs.mkdirSync(pngDir, { recursive: true });
}

// Get all SVG files
const svgFiles = fs.readdirSync(svgDir).filter(file => file.endsWith('.svg'));

if (svgFiles.length === 0) {
  console.log('No SVG files found in the assets directory.');
  console.log('Please add SVG files to the frontend/src/assets directory and run this script again.');
  process.exit(0);
}

console.log(`Found ${svgFiles.length} SVG files. Converting to PNG...`);

// Convert each SVG to PNG
const convertPromises = svgFiles.map(async (svgFile) => {
  const svgPath = path.join(svgDir, svgFile);
  const pngFile = svgFile.replace('.svg', '.png');
  const pngPath = path.join(pngDir, pngFile);

  try {
    // Convert SVG to PNG with sharp
    await sharp(svgPath)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted ${svgFile} to ${pngFile}`);
    return { success: true, file: svgFile };
  } catch (error) {
    console.error(`Error converting ${svgFile}:`, error.message);
    return { success: false, file: svgFile, error: error.message };
  }
});

// Process all conversions
Promise.all(convertPromises)
  .then(results => {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\nConversion Summary:');
    console.log(`- Total SVG files: ${svgFiles.length}`);
    console.log(`- Successfully converted: ${successful}`);
    console.log(`- Failed conversions: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed conversions:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`- ${r.file}: ${r.error}`));
    }
  })
  .catch(error => {
    console.error('An unexpected error occurred:', error);
  });
