#!/bin/bash

echo "🔧 Fixing Admin Layout Issues..."
echo ""

# Fix 1: Remove double background from stat cards
echo "📝 Fix 1: Removing double backgrounds from stat cards..."
find app/admin -name "*.tsx" -type f -exec sed -i 's/className="bg-\[#1e293b\] border border-\[#334155\] rounded-lg p-4 "/className="border border-[#334155] rounded-lg p-4 bg-[#334155] "/g' {} +
echo "✅ Double backgrounds removed"
echo ""

# Fix 2: Standardize placeholder colors
echo "📝 Fix 2: Standardizing placeholder colors..."
find app/admin -name "*.tsx" -type f -exec sed -i 's/placeholder-gray-400/placeholder-[#94a3b8]/g' {} +
echo "✅ Placeholder colors standardized"
echo ""

# Fix 3: Add shadow-lg to main content cards (tables)
echo "📝 Fix 3: Adding shadow-lg to main content cards..."
find app/admin -name "*.tsx" -type f -exec sed -i 's/border border-\[#334155\] shadow-sm rounded-lg/border border-[#334155] shadow-lg rounded-lg/g' {} +
echo "✅ Shadow depths standardized"
echo ""

# Fix 4: Remove extra spaces in class names
echo "📝 Fix 4: Cleaning up class names..."
find app/admin -name "*.tsx" -type f -exec sed -i 's/p-4 >/p-4>/g' {} +
find app/admin -name "*.tsx" -type f -exec sed -i 's/p-6 >/p-6>/g' {} +
echo "✅ Class names cleaned"
echo ""

# Fix 5: Standardize hover states on stat cards
echo "📝 Fix 5: Adding hover states to stat cards..."
find app/admin -name "*.tsx" -type f -exec sed -i 's/border border-\[#334155\] rounded-lg p-4 bg-\[#334155\]/border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors/g' {} +
echo "✅ Hover states added"
echo ""

echo "✨ All layout fixes completed!"
echo ""
echo "Fixed issues:"
echo "  ✅ Removed double backgrounds from stat cards"
echo "  ✅ Standardized placeholder colors"
echo "  ✅ Added shadow-lg to content cards"
echo "  ✅ Cleaned up class names"
echo "  ✅ Added hover effects to stat cards"
