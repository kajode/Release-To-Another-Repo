// Debug script for the DecodeAssetFile function
const path = require('path');
const fs = require('fs');

// Create test assets directory and sample files
const testAssetsDir = path.join(__dirname, 'test-assets');
if (!fs.existsSync(testAssetsDir)) {
  fs.mkdirSync(testAssetsDir, { recursive: true });
  fs.writeFileSync(path.join(testAssetsDir, 'test-file1.txt'), 'This is test file 1');
  fs.writeFileSync(path.join(testAssetsDir, 'test-file2.json'), '{"test": "This is test file 2"}');
  
  // Create a subdirectory with files
  const subDir = path.join(testAssetsDir, 'subdir');
  fs.mkdirSync(subDir, { recursive: true });
  fs.writeFileSync(path.join(subDir, 'subdir-file.txt'), 'This is a file in a subdirectory');
}

// Set up environment for debugging
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'debug-token';
process.env.INPUT_ASSET_FILES = testAssetsDir;

// Override console.log to make debugging output more visible
const originalConsoleLog = console.log;
console.log = function() {
  const args = Array.from(arguments);
  originalConsoleLog('\x1b[36m[DEBUG]\x1b[0m', ...args);
};

// Mock @actions/core
const core = {
  getInput: function(name, options) {
    if (name === 'asset_files') {
      return process.env.INPUT_ASSET_FILES;
    }
    return '';
  },
  info: function(message) {
    console.log('[INFO]', message);
  },
  debug: function(message) {
    console.log('[DEBUG]', message);
  },
  error: function(message) {
    console.log('[ERROR]', message);
  },
  setOutput: function() {},
  setFailed: function(error) {
    console.error('[FAILED]', error);
  }
};

// Extract the DecodeAssetFile function from main.js
async function DecodeAssetFile() {
  const assetFile = process.env.INPUT_ASSET_FILES;
  const assetArray = [];
  
  console.log('=== Debug Information ===');
  console.log('Asset file/directory path:', assetFile);
  console.log('Absolute path:', path.resolve(assetFile));
  console.log('Path exists:', fs.existsSync(assetFile) ? 'Yes' : 'No');
  
  if (fs.existsSync(assetFile)) {
    const stats = fs.statSync(assetFile);
    console.log('Is directory:', stats.isDirectory() ? 'Yes' : 'No');
    console.log('Is file:', stats.isFile() ? 'Yes' : 'No');
    console.log('File size:', stats.size, 'bytes');
    console.log('Created:', stats.birthtime);
    console.log('Modified:', stats.mtime);
  }
  
  core.info('DecodeAssetFile Start');
  let dir;
  try {
    // Try to list all files recursively (if supported)
    try {
      console.log('Recursive directory listing:');
      const recursiveFiles = fs.readdirSync(assetFile, { recursive: true });
      console.log(recursiveFiles);
    } catch (e) {
      console.log('Recursive listing not supported or failed:', e.message);
    }
    
    // Standard directory listing
    console.log('Standard directory listing:');
    dir = fs.readdirSync(assetFile);
    console.log(dir);
  } catch (err) {
    core.debug(err);
    console.log('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    
    switch (err.code) {
      case 'ENOENT':
        core.info(assetFile + ' not exists');
        break;
      case 'ENOTDIR':
        core.info(assetFile + ' exists');
        assetArray.push(assetFile);
        break;
      default:
        core.error(err);
        break;
    }
  }
  
  if (dir) {
    console.log('Processing directory contents:');
    dir.forEach((val) => {
      let subFile = path.join(assetFile, val);
      const isDir = fs.statSync(subFile).isDirectory();
      console.log(`- ${val} (${isDir ? 'directory' : 'file'})`);
      
      if (!isDir) {
        assetArray.push(subFile);
      }
    });
  }
  
  core.info('DecodeAssetFile Done');
  
  console.log('=== Results ===');
  console.log('Files found for upload:');
  assetArray.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  return assetArray;
}

// Run the function
console.log('Starting asset file debugging...');
DecodeAssetFile().then(() => {
  console.log('Asset file debugging completed.');
}).catch(err => {
  console.error('Error during debugging:', err);
}); 