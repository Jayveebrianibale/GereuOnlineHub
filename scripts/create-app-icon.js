const fs = require('fs');
const path = require('path');

// This script creates an app icon with white background and reduced logo size
// Run with: node scripts/create-app-icon.js

const createAppIcon = () => {
  console.log('🎨 Creating app icon with white background and reduced logo size...');
  
  // For now, we'll create a simple HTML file that you can use to generate the icon
  // This is because we can't directly manipulate images in Node.js without additional packages
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>App Icon Generator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .icon-preview {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .icon-size {
            text-align: center;
        }
        .icon-size h3 {
            margin-bottom: 10px;
            color: #333;
        }
        .icon {
            background: white;
            border: 2px solid #ddd;
            border-radius: 20%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .icon-1024 { width: 1024px; height: 1024px; }
        .icon-512 { width: 512px; height: 512px; }
        .icon-256 { width: 256px; height: 256px; }
        .icon-128 { width: 128px; height: 128px; }
        .icon-64 { width: 64px; height: 64px; }
        .icon-32 { width: 32px; height: 32px; }
        
        .logo {
            width: 70%;
            height: 70%;
            object-fit: contain;
        }
        
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .instructions h3 {
            color: #1976d2;
            margin-top: 0;
        }
        
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .instructions li {
            margin: 5px 0;
        }
        
        .download-btn {
            background: #4caf50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        
        .download-btn:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 App Icon Generator</h1>
        <p>This tool helps you create app icons with white background and reduced logo size.</p>
        
        <div class="instructions">
            <h3>📋 Instructions:</h3>
            <ol>
                <li>Replace the logo.png in the assets/images folder with your desired logo</li>
                <li>Open this HTML file in your browser</li>
                <li>Right-click on each icon size and "Save image as..."</li>
                <li>Save them with appropriate names (icon-1024.png, icon-512.png, etc.)</li>
                <li>Replace your current logo.png with the 1024x1024 version</li>
            </ol>
        </div>
        
        <div class="icon-preview">
            <div class="icon-size">
                <h3>1024x1024 (Main Icon)</h3>
                <div class="icon icon-1024">
                    <img src="../assets/images/logo.png" alt="Logo" class="logo" id="logo-img">
                </div>
                <button class="download-btn" onclick="downloadIcon(1024)">Download</button>
            </div>
            
            <div class="icon-size">
                <h3>512x512</h3>
                <div class="icon icon-512">
                    <img src="../assets/images/logo.png" alt="Logo" class="logo">
                </div>
                <button class="download-btn" onclick="downloadIcon(512)">Download</button>
            </div>
            
            <div class="icon-size">
                <h3>256x256</h3>
                <div class="icon icon-256">
                    <img src="../assets/images/logo.png" alt="Logo" class="logo">
                </div>
                <button class="download-btn" onclick="downloadIcon(256)">Download</button>
            </div>
            
            <div class="icon-size">
                <h3>128x128</h3>
                <div class="icon icon-128">
                    <img src="../assets/images/logo.png" alt="Logo" class="logo">
                </div>
                <button class="download-btn" onclick="downloadIcon(128)">Download</button>
            </div>
            
            <div class="icon-size">
                <h3>64x64</h3>
                <div class="icon icon-64">
                    <img src="../assets/images/logo.png" alt="Logo" class="logo">
                </div>
                <button class="download-btn" onclick="downloadIcon(64)">Download</button>
            </div>
            
            <div class="icon-size">
                <h3>32x32</h3>
                <div class="icon icon-32">
                    <img src="../assets/images/logo.png" alt="Logo" class="logo">
                </div>
                <button class="download-btn" onclick="downloadIcon(32)">Download</button>
            </div>
        </div>
        
        <div class="instructions">
            <h3>🔧 Alternative Method (Using Online Tools):</h3>
            <ol>
                <li>Go to <a href="https://www.canva.com" target="_blank">Canva.com</a> or <a href="https://www.figma.com" target="_blank">Figma.com</a></li>
                <li>Create a new design with 1024x1024 pixels</li>
                <li>Set background to white (#FFFFFF)</li>
                <li>Add your logo and resize it to about 70% of the canvas</li>
                <li>Center the logo</li>
                <li>Export as PNG</li>
                <li>Replace your current logo.png</li>
            </ol>
        </div>
    </div>
    
    <script>
        function downloadIcon(size) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Fill with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            
            // Draw logo
            const logo = document.getElementById('logo-img');
            const logoSize = size * 0.7; // 70% of the icon size
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;
            
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            
            // Download
            const link = document.createElement('a');
            link.download = \`icon-\${size}.png\`;
            link.href = canvas.toDataURL();
            link.click();
        }
    </script>
</body>
</html>
`;

  // Write the HTML file
  const htmlPath = path.join(__dirname, '..', 'app-icon-generator.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log('✅ App icon generator created!');
  console.log('📁 File location: app-icon-generator.html');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Open app-icon-generator.html in your browser');
  console.log('2. Right-click on the 1024x1024 icon and save it');
  console.log('3. Replace your current assets/images/logo.png with the new one');
  console.log('4. Your app icon will now have white background with reduced logo size!');
};

createAppIcon();
