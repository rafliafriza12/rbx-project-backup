#!/bin/bash

echo "🔍 Push Notification Configuration Check"
echo "========================================"
echo ""

# Check .env.local file
if [ -f .env.local ]; then
    echo "✅ .env.local file exists"
    
    # Check VAPID keys
    if grep -q "NEXT_PUBLIC_VAPID_PUBLIC_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY found"
    else
        echo "❌ NEXT_PUBLIC_VAPID_PUBLIC_KEY NOT found"
    fi
    
    if grep -q "VAPID_PRIVATE_KEY" .env.local; then
        echo "✅ VAPID_PRIVATE_KEY found"
    else
        echo "❌ VAPID_PRIVATE_KEY NOT found"
    fi
    
    if grep -q "VAPID_SUBJECT" .env.local; then
        echo "✅ VAPID_SUBJECT found"
    else
        echo "❌ VAPID_SUBJECT NOT found"
    fi
else
    echo "❌ .env.local file NOT found"
    echo ""
    echo "Please create .env.local with VAPID keys:"
    echo "  npx web-push generate-vapid-keys"
fi

echo ""

# Check Service Worker
if [ -f public/sw.js ]; then
    echo "✅ Service Worker (public/sw.js) exists"
else
    echo "❌ Service Worker (public/sw.js) NOT found"
fi

echo ""

# Check models
if [ -f models/PushSubscription.ts ]; then
    echo "✅ PushSubscription model exists"
else
    echo "❌ PushSubscription model NOT found"
fi

echo ""

# Check API routes
if [ -f app/api/push/subscribe/route.ts ]; then
    echo "✅ Subscribe API exists"
else
    echo "❌ Subscribe API NOT found"
fi

if [ -f app/api/push/vapid-public-key/route.ts ]; then
    echo "✅ VAPID public key API exists"
else
    echo "❌ VAPID public key API NOT found"
fi

if [ -f app/api/push/test/route.ts ]; then
    echo "✅ Test push API exists"
else
    echo "❌ Test push API NOT found"
fi

if [ -f app/api/push/debug/route.ts ]; then
    echo "✅ Debug API exists"
else
    echo "❌ Debug API NOT found"
fi

echo ""

# Check web-push package
if [ -d node_modules/web-push ] || [ -d node_modules/.pnpm/web-push* ]; then
    echo "✅ web-push package installed"
else
    echo "❌ web-push package NOT installed"
    echo "   Run: pnpm install web-push"
fi

if [ -d node_modules/@types/web-push ] || [ -d node_modules/.pnpm/@types+web-push* ]; then
    echo "✅ @types/web-push installed"
else
    echo "❌ @types/web-push NOT installed"
    echo "   Run: pnpm install --save-dev @types/web-push"
fi

echo ""
echo "========================================"
echo "🧪 Testing URLs:"
echo "  Test Page:  http://localhost:3000/test-push"
echo "  User Chat:  http://localhost:3000/chat"
echo "  Admin Chat: http://localhost:3000/admin/chat"
echo ""
echo "📋 Next Steps:"
echo "  1. Start dev server: pnpm dev"
echo "  2. Open test page: http://localhost:3000/test-push"
echo "  3. Click 'Subscribe to Push'"
echo "  4. Click 'Send Test Push'"
echo "  5. Close browser and test again"
echo ""
