/**
 * /api/upgrades/definitions.ts - Next.js API Route
 * Loads upgrade definitions from game-data/upgrades/*.json files
 */

import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📂 [UPGRADE-DEFINITIONS] === LOADING UPGRADES FROM JSON FILES ===');
  console.log('📂 [UPGRADE-DEFINITIONS] Method:', req.method);
  console.log('📂 [UPGRADE-DEFINITIONS] URL:', req.url);
  
  if (req.method !== 'GET') {
    console.log(`❌ [UPGRADE-DEFINITIONS] Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }

  try {
    // Get the project root directory
    const projectRoot = process.cwd();
    const upgradesDir = path.join(projectRoot, 'game-data', 'upgrades');
    
    console.log('📂 [UPGRADE-DEFINITIONS] Project root:', projectRoot);
    console.log('📂 [UPGRADE-DEFINITIONS] Upgrades directory:', upgradesDir);
    console.log('📂 [UPGRADE-DEFINITIONS] Directory exists:', fs.existsSync(upgradesDir));
    
    if (!fs.existsSync(upgradesDir)) {
      console.error('❌ [UPGRADE-DEFINITIONS] Upgrades directory not found!');
      return res.status(404).json({
        success: false,
        error: 'Upgrades directory not found',
        searchPath: upgradesDir,
        projectRoot,
        dirExists: false
      });
    }
    
    // Read all JSON files
    const files = fs.readdirSync(upgradesDir);
    console.log('📂 [UPGRADE-DEFINITIONS] Files in directory:', files);
    
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    console.log('📂 [UPGRADE-DEFINITIONS] JSON files found:', jsonFiles);
    
    if (jsonFiles.length === 0) {
      console.warn('⚠️ [UPGRADE-DEFINITIONS] No JSON files found!');
      return res.status(404).json({
        success: false,
        error: 'No upgrade JSON files found',
        searchPath: upgradesDir,
        allFiles: files,
        jsonFiles: []
      });
    }
    
    const allUpgrades: any[] = [];
    const loadResults = {
      loaded: 0,
      errors: 0,
      files: {} as Record<string, any>
    };
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(upgradesDir, file);
        console.log(`📂 [UPGRADE-DEFINITIONS] Reading file: ${filePath}`);
        
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        console.log(`📂 [UPGRADE-DEFINITIONS] File ${file} size: ${rawContent.length} chars`);
        console.log(`📂 [UPGRADE-DEFINITIONS] File ${file} preview:`, rawContent.substring(0, 100) + '...');
        
        if (rawContent.trim() === '' || rawContent.trim() === '[]') {
          console.warn(`⚠️ [UPGRADE-DEFINITIONS] Empty file: ${file}`);
          loadResults.files[file] = { status: 'empty', upgrades: 0 };
          continue;
        }
        
        const parsed = JSON.parse(rawContent);
        
        if (Array.isArray(parsed)) {
          const upgradesWithMeta = parsed.map((upgrade, index) => ({
            ...upgrade,
            sourceFile: file,
            sourceIndex: index,
            currentLevel: 0, // Initialize at 0
            loadedAt: new Date().toISOString()
          }));
          
          allUpgrades.push(...upgradesWithMeta);
          loadResults.loaded += parsed.length;
          loadResults.files[file] = { 
            status: 'success', 
            upgrades: parsed.length,
            names: parsed.map(u => u.name)
          };
          
          console.log(`✅ [UPGRADE-DEFINITIONS] Loaded ${parsed.length} upgrades from ${file}`);
          console.log(`✅ [UPGRADE-DEFINITIONS] Upgrade names from ${file}:`, parsed.map(u => u.name));
        } else if (parsed && typeof parsed === 'object') {
          const upgradeWithMeta = {
            ...parsed,
            sourceFile: file,
            sourceIndex: 0,
            currentLevel: 0,
            loadedAt: new Date().toISOString()
          };
          
          allUpgrades.push(upgradeWithMeta);
          loadResults.loaded++;
          loadResults.files[file] = { 
            status: 'success', 
            upgrades: 1,
            names: [parsed.name]
          };
          
          console.log(`✅ [UPGRADE-DEFINITIONS] Loaded 1 upgrade from ${file}: ${parsed.name}`);
        } else {
          console.warn(`⚠️ [UPGRADE-DEFINITIONS] Invalid JSON structure in ${file}:`, typeof parsed);
          loadResults.errors++;
          loadResults.files[file] = { 
            status: 'invalid', 
            upgrades: 0, 
            error: 'Invalid JSON structure'
          };
        }
      } catch (parseError) {
        console.error(`❌ [UPGRADE-DEFINITIONS] Failed to parse ${file}:`, parseError.message);
        loadResults.errors++;
        loadResults.files[file] = { 
          status: 'error', 
          upgrades: 0, 
          error: parseError.message 
        };
      }
    }
    
    // Sort upgrades by category and sortOrder
    allUpgrades.sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    
    const categories = [...new Set(allUpgrades.map(u => u.category))];
    
    console.log('✅ [UPGRADE-DEFINITIONS] === LOADING COMPLETE ===');
    console.log(`✅ [UPGRADE-DEFINITIONS] Total loaded: ${allUpgrades.length}`);
    console.log(`✅ [UPGRADE-DEFINITIONS] Categories: ${categories.join(', ')}`);
    console.log(`✅ [UPGRADE-DEFINITIONS] Files processed: ${Object.keys(loadResults.files).length}`);
    console.log(`✅ [UPGRADE-DEFINITIONS] Load results:`, loadResults);
    
    res.status(200).json({
      success: true,
      count: allUpgrades.length,
      upgrades: allUpgrades,
      categories,
      loadResults,
      meta: {
        searchPath: upgradesDir,
        jsonFilesFound: jsonFiles.length,
        upgradesLoaded: allUpgrades.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [UPGRADE-DEFINITIONS] === CRITICAL ERROR ===');
    console.error('❌ [UPGRADE-DEFINITIONS] Error:', error.message);
    console.error('❌ [UPGRADE-DEFINITIONS] Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to load upgrade definitions',
      details: {
        message: error.message,
        stack: error.stack,
        projectRoot: process.cwd()
      },
      timestamp: new Date().toISOString()
    });
  }
}