const fs = require('fs');
const path = require('path');

// This script creates instructions for modifying your app icon
// Since we can't directly manipulate images without additional packages

const createIconInstructions = () => {
  console.log('🎨 App Icon Modification Guide');
  console.log('================================');
  console.log('');
  
  console.log('📋 To create an app icon with white background and reduced logo size:');
  console.log('');
  
  console.log('🔧 Method 1: Using Online Tools (Recommended)');
  console.log('1. Go to https://www.canva.com or https://www.figma.com');
  console.log('2. Create a new design with 1024x1024 pixels');
  console.log('3. Set background color to white (#FFFFFF)');
  console.log('4. Upload your current logo.png');
  console.log('5. Resize the logo to about 70% of the canvas (around 716x716 pixels)');
  console.log('6. Center the logo on the white background');
  console.log('7. Export as PNG with high quality');
  console.log('8. Replace your current assets/images/logo.png with the new file');
  console.log('');
  
  console.log('🔧 Method 2: Using Paint.NET or GIMP (Free)');
  console.log('1. Open Paint.NET or GIMP');
  console.log('2. Create a new image: 1024x1024 pixels');
  console.log('3. Fill the background with white color');
  console.log('4. Open your current logo.png');
  console.log('5. Copy the logo and paste it into the white canvas');
  console.log('6. Resize the logo to 70% of the canvas size');
  console.log('7. Center the logo');
  console.log('8. Save as PNG');
  console.log('9. Replace your current assets/images/logo.png');
  console.log('');
  
  console.log('🔧 Method 3: Using the HTML Generator');
  console.log('1. Open the app-icon-generator.html file in your browser');
  console.log('2. Right-click on the 1024x1024 icon preview');
  console.log('3. Select "Save image as..."');
  console.log('4. Save it as logo.png');
  console.log('5. Replace your current assets/images/logo.png');
  console.log('');
  
  console.log('📱 After updating the icon:');
  console.log('1. Your app icon will have a white background');
  console.log('2. The logo will be reduced to 70% of the icon size');
  console.log('3. The logo will be centered on the white background');
  console.log('4. This will work for both iOS and Android');
  console.log('');
  
  console.log('🔄 To apply the changes:');
  console.log('1. Replace assets/images/logo.png with your new icon');
  console.log('2. Run: npx expo prebuild --clean');
  console.log('3. Build your app: eas build --profile development --platform android');
  console.log('');
  
  console.log('✅ Your app icon will now look professional with white background!');
};

// Also create a simple HTML file for quick testing
const createSimpleIconPreview = () => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>App Icon Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .preview {
            display: flex;
            gap: 30px;
            align-items: center;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .current-icon {
            text-align: center;
        }
        .new-icon {
            text-align: center;
        }
        .icon {
            width: 200px;
            height: 200px;
            border: 3px solid #ddd;
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 10px 0;
            background: white;
            position: relative;
            overflow: hidden;
        }
        .current-icon .icon {
            background: transparent;
        }
        .new-icon .icon {
            background: white;
        }
        .logo {
            width: 70%;
            height: 70%;
            object-fit: contain;
        }
        h3 {
            color: #333;
            margin: 10px 0;
        }
        .instructions {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .download-btn {
            background: #4caf50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 0;
        }
        .download-btn:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <h1>🎨 App Icon Preview</h1>
    
    <div class="preview">
        <div class="current-icon">
            <h3>Current Icon</h3>
            <div class="icon">
                <img src="../assets/images/logo.png" alt="Current Logo" class="logo">
            </div>
            <p>Your current logo</p>
        </div>
        
        <div class="new-icon">
            <h3>New Icon (Preview)</h3>
            <div class="icon">
                <img src="../assets/images/logo.png" alt="New Logo" class="logo">
            </div>
            <p>White background + 70% logo size</p>
            <button class="download-btn" onclick="downloadNewIcon()">Download New Icon</button>
        </div>
    </div>
    
    <div class="instructions">
        <h3>📋 How to Apply Changes:</h3>
        <ol>
            <li>Click "Download New Icon" button above</li>
            <li>Save the image as "logo.png"</li>
            <li>Replace your current assets/images/logo.png with the new file</li>
            <li>Run: <code>npx expo prebuild --clean</code></li>
            <li>Build your app: <code>eas build --profile development --platform android</code></li>
        </ol>
    </div>
    
    <script>
        function downloadNewIcon() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            
            // Fill with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 1024, 1024);
            
            // Draw logo at 70% size
            const logo = document.querySelector('.logo');
            const logoSize = 1024 * 0.7; // 70% of icon size
            const x = (1024 - logoSize) / 2;
            const y = (1024 - logoSize) / 2;
            
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            
            // Download
            const link = document.createElement('a');
            link.download = 'logo_white_bg.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    </script>
</body>
</html>
`;

  const htmlPath = path.join(__dirname, '..', 'icon-preview.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('📁 Icon preview created: icon-preview.html');
};

createIconInstructions();
createSimpleIconPreview();
