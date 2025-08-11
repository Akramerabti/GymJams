// server/scripts/setupAvatarAssets.js
import simpleAvatarGenerationService from '../src/services/simpleAvatarGeneration.service.js';
import supabaseStorageService from '../src/services/supabaseStorage.service.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Setup script to create default avatar assets in Supabase storage
 * Run this script once to initialize the avatar system
 */

class AvatarAssetSetup {
  constructor() {
    this.assetsToCreate = [
      // Default fallback avatars for each gender
      {
        path: 'avatar-assets/fallback/default_mouse_male.png',
        description: 'Default male mouse avatar',
        gender: 'male',
        color: '#8B4513'
      },
      {
        path: 'avatar-assets/fallback/default_mouse_female.png', 
        description: 'Default female mouse avatar',
        gender: 'female',
        color: '#FFC0CB'
      },
      {
        path: 'avatar-assets/fallback/default_mouse_other.png',
        description: 'Default other gender mouse avatar', 
        gender: 'other',
        color: '#93C5FD'
      }
    ];
  }

  /**
   * Create a simple mouse avatar SVG
   */
  createMouseAvatarSVG(color, gender, size = 256) {
    // Different expressions based on gender
    const expressions = {
      male: '😊',
      female: '😊', 
      other: '😊'
    };

    const expression = expressions[gender] || '😊';

    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        <!-- Background circle -->
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" 
                fill="${color}" 
                stroke="white" 
                stroke-width="8"/>
        
        <!-- Mouse ears -->
        <circle cx="${size/2 - 60}" cy="${size/2 - 60}" r="25" fill="${this.darkenColor(color)}" stroke="white" stroke-width="3"/>
        <circle cx="${size/2 + 60}" cy="${size/2 - 60}" r="25" fill="${this.darkenColor(color)}" stroke="white" stroke-width="3"/>
        
        <!-- Inner ears -->
        <circle cx="${size/2 - 60}" cy="${size/2 - 60}" r="15" fill="#FFB6C1"/>
        <circle cx="${size/2 + 60}" cy="${size/2 - 60}" r="15" fill="#FFB6C1"/>
        
        <!-- Face -->
        <circle cx="${size/2}" cy="${size/2}" r="80" fill="${color}" stroke="white" stroke-width="4"/>
        
        <!-- Eyes -->
        <circle cx="${size/2 - 25}" cy="${size/2 - 15}" r="8" fill="black"/>
        <circle cx="${size/2 + 25}" cy="${size/2 - 15}" r="8" fill="black"/>
        <circle cx="${size/2 - 22}" cy="${size/2 - 18}" r="3" fill="white"/>
        <circle cx="${size/2 + 28}" cy="${size/2 - 18}" r="3" fill="white"/>
        
        <!-- Nose -->
        <ellipse cx="${size/2}" cy="${size/2 + 5}" rx="4" ry="3" fill="#FFB6C1"/>
        
        <!-- Mouth -->
        <path d="M ${size/2 - 15} ${size/2 + 20} Q ${size/2} ${size/2 + 30} ${size/2 + 15} ${size/2 + 20}" 
              stroke="black" stroke-width="2" fill="none"/>
        
        <!-- Whiskers -->
        <line x1="${size/2 - 50}" y1="${size/2}" x2="${size/2 - 30}" y2="${size/2 - 5}" stroke="black" stroke-width="1"/>
        <line x1="${size/2 - 50}" y1="${size/2 + 10}" x2="${size/2 - 30}" y2="${size/2 + 10}" stroke="black" stroke-width="1"/>
        <line x1="${size/2 + 50}" y1="${size/2}" x2="${size/2 + 30}" y2="${size/2 - 5}" stroke="black" stroke-width="1"/>
        <line x1="${size/2 + 50}" y1="${size/2 + 10}" x2="${size/2 + 30}" y2="${size/2 + 10}" stroke="black" stroke-width="1"/>
        
        <!-- Gym dumbbell icon -->
        <g transform="translate(${size/2 - 20}, ${size/2 + 50})">
          <rect x="0" y="15" width="40" height="6" fill="#333" rx="3"/>
          <circle cx="3" cy="18" r="8" fill="#666"/>
          <circle cx="37" cy="18" r="8" fill="#666"/>
        </g>
        
        <!-- Gender-specific accessory -->
        ${gender === 'female' ? `
          <!-- Bow -->
          <g transform="translate(${size/2 - 15}, ${size/2 - 90})">
            <path d="M0,10 Q15,0 30,10 Q15,20 0,10" fill="#FF69B4"/>
            <circle cx="15" cy="10" r="4" fill="#FF1493"/>
          </g>
        ` : gender === 'male' ? `
          <!-- Cap -->
          <ellipse cx="${size/2}" cy="${size/2 - 70}" rx="50" ry="15" fill="#4169E1"/>
          <ellipse cx="${size/2}" cy="${size/2 - 85}" rx="45" ry="20" fill="#4169E1"/>
        ` : `
          <!-- Headband -->
          <rect x="${size/2 - 45}" y="${size/2 - 80}" width="90" height="8" fill="#9370DB" rx="4"/>
        `}
      </svg>
    `;
  }

  /**
   * Darken a hex color
   */
  darkenColor(hex, amount = 20) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, (num >> 8 & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  /**
   * Create and upload a default avatar
   */
  async createAndUploadAvatar(assetInfo) {
    try {
      console.log(`Creating ${assetInfo.description}...`);
      
      // Create SVG
      const svgContent = this.createMouseAvatarSVG(assetInfo.color, assetInfo.gender);
      
      // Convert SVG to PNG
      const pngBuffer = await sharp(Buffer.from(svgContent))
        .png()
        .toBuffer();
      
      // Extract filename from path
      const filename = path.basename(assetInfo.path);
      const folder = path.dirname(assetInfo.path).replace('avatar-assets/', '');
      
      // Upload to Supabase
      const uploadResult = await supabaseStorageService.uploadFile(
        pngBuffer,
        filename,
        `avatar-assets/${folder}`
      );
      
      console.log(`✅ Created ${assetInfo.description}: ${uploadResult.url}`);
      return uploadResult;
      
    } catch (error) {
      console.error(`❌ Failed to create ${assetInfo.description}:`, error);
      return null;
    }
  }

  /**
   * Check if an asset already exists
   */
  async assetExists(assetPath) {
    try {
      const publicUrl = supabaseStorageService.getPublicUrl(assetPath);
      const response = await fetch(publicUrl);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup all avatar assets
   */
  async setupAllAssets() {
    console.log('🚀 Starting avatar assets setup...\n');
    
    const results = [];
    
    for (const asset of this.assetsToCreate) {
      // Check if asset already exists
      if (await this.assetExists(asset.path)) {
        console.log(`⏭️  ${asset.description} already exists, skipping...`);
        continue;
      }
      
      const result = await this.createAndUploadAvatar(asset);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✨ Avatar assets setup complete!');
    console.log(`Created ${results.filter(r => r).length} new assets`);
    
    // Test the avatar service
    console.log('\n🧪 Testing avatar service...');
    await this.testAvatarService();
  }

  /**
   * Test the avatar service with the new assets
   */
  async testAvatarService() {
    try {
      const testConfig = {
        baseCharacter: 'gym_mouse',
        furColor: '#8B4513',
        mood: 'happy',
        pose: 'standing',
        type: 'mouse',
        version: 1
      };
      
      // Test male avatar
      console.log('Testing male avatar generation...');
      const maleResult = await simpleAvatarGenerationService.generateAvatar(testConfig, 'Male', 64);
      console.log('✅ Male avatar test:', maleResult.url);
      
      // Test female avatar  
      console.log('Testing female avatar generation...');
      const femaleResult = await simpleAvatarGenerationService.generateAvatar(testConfig, 'Female', 64);
      console.log('✅ Female avatar test:', femaleResult.url);
      
      // Test fallback
      console.log('Testing fallback avatar...');
      const fallbackResult = simpleAvatarGenerationService.getFallbackAvatar({}, 'Other');
      console.log('✅ Fallback avatar test:', fallbackResult.url);
      
    } catch (error) {
      console.error('❌ Avatar service test failed:', error);
    }
  }

  /**
   * Create directory structure info
   */
  getDirectoryStructure() {
    return `
📁 Required Supabase Storage Structure:
gym-bros/
├── avatar-assets/
│   ├── fallback/
│   │   ├── default_mouse_male.png
│   │   ├── default_mouse_female.png
│   │   └── default_mouse_other.png
│   └── characters/
│       └── mouse/
│           ├── male/
│           ├── female/
│           └── other/
├── generated-avatars/
└── map-avatars/

This script will create the fallback avatars automatically.
You can later add more character variations in the characters/ folder.
    `;
  }
}

// Main execution
async function main() {
  const setup = new AvatarAssetSetup();
  
  console.log(setup.getDirectoryStructure());
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  // Wait 3 seconds before starting
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await setup.setupAllAssets();
  
  process.exit(0);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AvatarAssetSetup;