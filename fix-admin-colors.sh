#!/bin/bash

# Admin Theme Color Fix Script
# This script replaces old gray/white colors with the new admin theme colors

# List of admin page files (excluding already fixed pages)
FILES=(
  "app/admin/profile/page.tsx"
  "app/admin/banners/page.tsx"
  "app/admin/joki/page.tsx"
  "app/admin/robux-pricing/page.tsx"
  "app/admin/email-management/page.tsx"
  "app/admin/roles/page.tsx"
  "app/admin/users/page.tsx"
  "app/admin/reviews/page.tsx"
  "app/admin/settings/page.tsx"
  "app/admin/gamepass/page.tsx"
  "app/admin/products/page.tsx"
  "app/admin/payment-methods/page.tsx"
)

echo "🎨 Starting Admin Theme Color Fix..."
echo ""

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing: $file"
    
    # Background colors
    sed -i 's/bg-gray-900/bg-[#0f172a]/g' "$file"
    sed -i 's/bg-gray-800/bg-[#1e293b]/g' "$file"
    sed -i 's/bg-gray-700/bg-[#334155]/g' "$file"
    sed -i 's/bg-gray-600/bg-[#475569]/g' "$file"
    sed -i 's/bg-gray-500/bg-[#64748b]/g' "$file"
    sed -i 's/bg-gray-50/bg-[#0f172a]/g' "$file"
    sed -i 's/bg-white\([^-]\)/bg-[#1e293b]\1/g' "$file"
    
    # Text colors
    sed -i 's/text-gray-900/text-[#0f172a]/g' "$file"
    sed -i 's/text-gray-800/text-[#1e293b]/g' "$file"
    sed -i 's/text-gray-700/text-[#334155]/g' "$file"
    sed -i 's/text-gray-600/text-[#475569]/g' "$file"
    sed -i 's/text-gray-500/text-[#64748b]/g' "$file"
    sed -i 's/text-gray-400/text-[#94a3b8]/g' "$file"
    sed -i 's/text-gray-300/text-[#cbd5e1]/g' "$file"
    sed -i 's/text-gray-200/text-[#e2e8f0]/g' "$file"
    sed -i 's/text-gray-100/text-[#f1f5f9]/g' "$file"
    sed -i 's/text-white\([^-]\)/text-[#f1f5f9]\1/g' "$file"
    sed -i 's/text-black\([^-]\)/text-[#0f172a]\1/g' "$file"
    
    # Border colors
    sed -i 's/border-gray-900/border-[#0f172a]/g' "$file"
    sed -i 's/border-gray-800/border-[#1e293b]/g' "$file"
    sed -i 's/border-gray-700/border-[#334155]/g' "$file"
    sed -i 's/border-gray-600/border-[#334155]/g' "$file"
    sed -i 's/border-gray-500/border-[#475569]/g' "$file"
    sed -i 's/border-gray-400/border-[#475569]/g' "$file"
    sed -i 's/border-gray-300/border-[#334155]/g' "$file"
    sed -i 's/border-gray-200/border-[#334155]/g' "$file"
    
    # Ring colors (for focus states)
    sed -i 's/ring-gray-600/ring-[#475569]/g' "$file"
    sed -i 's/ring-gray-500/ring-[#475569]/g' "$file"
    
    # Divide colors (for table rows)
    sed -i 's/divide-gray-700/divide-[#334155]/g' "$file"
    sed -i 's/divide-gray-600/divide-[#334155]/g' "$file"
    
    # Hover states
    sed -i 's/hover:bg-gray-900/hover:bg-[#0f172a]/g' "$file"
    sed -i 's/hover:bg-gray-800/hover:bg-[#1e293b]/g' "$file"
    sed -i 's/hover:bg-gray-700/hover:bg-[#334155]/g' "$file"
    sed -i 's/hover:bg-gray-600/hover:bg-[#475569]/g' "$file"
    sed -i 's/hover:bg-gray-50/hover:bg-[#1e293b]/g' "$file"
    
    sed -i 's/hover:text-gray-400/hover:text-[#94a3b8]/g' "$file"
    sed -i 's/hover:text-gray-300/hover:text-[#cbd5e1]/g' "$file"
    sed -i 's/hover:text-gray-200/hover:text-[#f1f5f9]/g' "$file"
    sed -i 's/hover:text-white\([^-]\)/hover:text-[#f1f5f9]\1/g' "$file"
    
    # Blue colors (buttons, links)
    sed -i 's/bg-blue-900/bg-[#1e3a8a]/g' "$file"
    sed -i 's/bg-blue-800/bg-[#1e40af]/g' "$file"
    sed -i 's/bg-blue-700/bg-[#1d4ed8]/g' "$file"
    sed -i 's/bg-blue-600/bg-[#3b82f6]/g' "$file"
    sed -i 's/bg-blue-500/bg-[#3b82f6]/g' "$file"
    sed -i 's/bg-blue-400/bg-[#60a5fa]/g' "$file"
    
    sed -i 's/text-blue-600/text-[#3b82f6]/g' "$file"
    sed -i 's/text-blue-500/text-[#3b82f6]/g' "$file"
    sed -i 's/text-blue-400/text-[#60a5fa]/g' "$file"
    sed -i 's/text-blue-300/text-[#93c5fd]/g' "$file"
    
    sed -i 's/hover:bg-blue-700/hover:bg-[#2563eb]/g' "$file"
    sed -i 's/hover:bg-blue-600/hover:bg-[#2563eb]/g' "$file"
    sed -i 's/hover:bg-blue-500/hover:bg-[#2563eb]/g' "$file"
    
    sed -i 's/border-blue-700/border-[#1d4ed8]/g' "$file"
    sed -i 's/border-blue-600/border-[#3b82f6]/g' "$file"
    sed -i 's/border-blue-500/border-[#3b82f6]/g' "$file"
    
    # Focus ring
    sed -i 's/focus:ring-blue-500/focus:ring-[#3b82f6]/g' "$file"
    sed -i 's/focus:border-blue-500/focus:border-[#3b82f6]/g' "$file"
    
    echo "   ✅ Updated: $file"
  else
    echo "   ⚠️  Not found: $file"
  fi
done

echo ""
echo "✨ Theme color fix completed!"
echo ""
echo "Updated colors:"
echo "  Background: gray-800 → #1e293b, gray-700 → #334155"
echo "  Text: gray-400 → #94a3b8, white → #f1f5f9"
echo "  Borders: gray-700 → #334155"
echo "  Buttons: blue-600 → #3b82f6"
