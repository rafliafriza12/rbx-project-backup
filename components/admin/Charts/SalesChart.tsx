'use client'
import { useEffect, useRef } from 'react';

export default function SalesChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Simple chart drawing
                const width = canvasRef.current.width;
                const height = canvasRef.current.height;

                // Clear canvas
                ctx.clearRect(0, 0, width, height);

                // Draw axes
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(40, height - 30);
                ctx.lineTo(width - 20, height - 30);
                ctx.moveTo(40, 20);
                ctx.lineTo(40, height - 30);
                ctx.stroke();

                // Sample data points
                const data = [30, 50, 40, 60, 55, 70, 65];
                const maxValue = Math.max(...data);
                const pointSpacing = (width - 80) / (data.length - 1);

                // Draw line chart
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.beginPath();

                data.forEach((value, index) => {
                    const x = 40 + index * pointSpacing;
                    const y = height - 30 - (value / maxValue) * (height - 60);

                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    // Draw point
                    ctx.fillStyle = '#3b82f6';
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                });

                ctx.stroke();
            }
        }
    }, []);

    return <canvas ref={canvasRef} width={400} height={200} className="w-full" />;
}
