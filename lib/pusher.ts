// Server-side Pusher configuration
import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;
let triggerCount = 0; // Track total triggers

export function getPusherInstance(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      useTLS: true,
    });

    console.log('[Pusher Instance] ✅ Created new Pusher instance');
    
    // Intercept ALL trigger calls to track them (debug mode only)
    const originalTrigger = pusherInstance.trigger.bind(pusherInstance);
    (pusherInstance as any).trigger = function(...args: any[]) {
      triggerCount++;
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Pusher Trigger] 🚀 Trigger #' + triggerCount);
        console.log('[Pusher Trigger] Channel:', args[0]);
        console.log('[Pusher Trigger] Event:', args[1]);
      }
      
      return (originalTrigger as any)(...args);
    };
  }
  return pusherInstance;
}

export function resetTriggerCount() {
  triggerCount = 0;
  console.log('[Pusher] Trigger count reset to 0');
}

export function getTriggerCount() {
  return triggerCount;
}

