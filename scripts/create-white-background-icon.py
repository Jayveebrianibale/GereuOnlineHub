#!/usr/bin/env python3
"""
App Icon Creator with White Background
This script creates an app icon with white background and reduced logo size
"""

import os
import sys
from PIL import Image, ImageOps

def create_app_icon():
    """Create app icon with white background and reduced logo size"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    logo_path = os.path.join(project_root, 'assets', 'images', 'logo.png')
    output_path = os.path.join(project_root, 'assets', 'images', 'logo_white_bg.png')
    
    print("🎨 Creating app icon with white background and reduced logo size...")
    
    try:
        # Check if logo exists
        if not os.path.exists(logo_path):
            print(f"❌ Logo not found at: {logo_path}")
            print("Please make sure you have a logo.png file in assets/images/")
            return False
        
        # Open the original logo
        logo = Image.open(logo_path)
        print(f"✅ Original logo loaded: {logo.size}")
        
        # Create a white background
        # Use 1024x1024 as the standard app icon size
        icon_size = 1024
        white_bg = Image.new('RGBA', (icon_size, icon_size), (255, 255, 255, 255))
        
        # Calculate logo size (70% of icon size)
        logo_size = int(icon_size * 0.7)
        
        # Resize logo while maintaining aspect ratio
        logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Calculate position to center the logo
        x = (icon_size - logo_size) // 2
        y = (icon_size - logo_size) // 2
        
        # Paste the logo onto white background
        if logo_resized.mode == 'RGBA':
            white_bg.paste(logo_resized, (x, y), logo_resized)
        else:
            white_bg.paste(logo_resized, (x, y))
        
        # Save the new icon
        white_bg.save(output_path, 'PNG', quality=95)
        print(f"✅ New icon created: {output_path}")
        print(f"📏 Icon size: {white_bg.size}")
        print(f"📏 Logo size: {logo_resized.size} (70% of icon)")
        
        # Create additional sizes
        sizes = [512, 256, 128, 64, 32]
        for size in sizes:
            resized_icon = white_bg.resize((size, size), Image.Resampling.LANCZOS)
            size_output_path = os.path.join(project_root, 'assets', 'images', f'icon_{size}.png')
            resized_icon.save(size_output_path, 'PNG', quality=95)
            print(f"✅ Created {size}x{size} icon: icon_{size}.png")
        
        print("\n📋 Next steps:")
        print("1. Replace your current logo.png with logo_white_bg.png")
        print("2. Or rename logo_white_bg.png to logo.png")
        print("3. Your app icon will now have white background with reduced logo size!")
        
        return True
        
    except ImportError:
        print("❌ PIL (Pillow) not installed. Installing...")
        os.system("pip install Pillow")
        print("✅ Pillow installed. Please run the script again.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = create_app_icon()
    if success:
        print("\n🎉 App icon creation completed successfully!")
    else:
        print("\n💥 App icon creation failed. Please check the error messages above.")
