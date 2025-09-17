import { useEffect } from 'react';
import Pusher from 'pusher-js';

export default function RealtimeListener() {
    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
        });

        const channel = pusher.subscribe('transactions');

        channel.bind('new-transaction', (data: any) => {
            console.log('New transaction:', data);
            // Update UI or show notification
        });

        channel.bind('status-updated', (data: any) => {
            console.log('Transaction status updated:', data);
            // Update UI
        });

        return () => {
            pusher.unsubscribe('transactions');
            pusher.disconnect();
        };
    }, []);

    return null;
}