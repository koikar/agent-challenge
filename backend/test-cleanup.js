#!/usr/bin/env node

/**
 * Test script for R2 cleanup endpoint
 * Usage: node test-cleanup.js [--dry-run]
 */

const WORKER_URL = "https://nosana.tedi.studio"; // Your worker URL
const CLEANUP_ENDPOINT = "/cleanup-r2";

async function testCleanup(dryRun = false) {
  try {
    console.log(`🧹 Testing R2 cleanup endpoint${dryRun ? ' (DRY RUN)' : ''}...`);
    
    const response = await fetch(`${WORKER_URL}${CLEANUP_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brandsToKeep: ["nosana.io", "mastra"],
        dryRun: dryRun
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log("✅ Cleanup response:", JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`\n📊 Summary:`);
      console.log(`- Brands kept: ${result.brandsKept?.join(", ") || "none"}`);
      console.log(`- Folders deleted: ${result.deletedFolders?.length || 0}`);
      console.log(`- Errors: ${result.errors?.length || 0}`);
      
      if (result.deletedFolders?.length > 0) {
        console.log(`- Deleted folders: ${result.deletedFolders.join(", ")}`);
      }
      
      if (result.errors?.length > 0) {
        console.log(`- Errors: ${result.errors.join(", ")}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error testing cleanup:", error.message);
  }
}

// Parse command line arguments
const isDryRun = process.argv.includes("--dry-run");

// Run the test
testCleanup(isDryRun);