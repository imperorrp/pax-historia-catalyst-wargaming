"use client"
import { useEffect, useRef } from "react"
import { renderVisualAction, renderVisualEffect, drawUnitStatus } from "@/lib/visual-action-library"
import type { VisualActionType } from "@/lib/types"

interface LegendItemProps {
  title: string
  action: string
  description: string
}

export function LegendItem({ title, action, description }: LegendItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw action visualization
    const from = { x: 20, y: 35 };
    const to = { x: 80, y: 35 };
    
    renderVisualAction(action as VisualActionType, {
      ctx,
      from,
      to,
      opacity: 0.9,
    });
  }, [action]);

  return (
    <div className="p-3 bg-white/50 rounded-lg border border-amber-900/10">
      <div className="flex items-center gap-3 mb-1">
        <canvas 
          ref={canvasRef} 
          width={100} 
          height={70}
          className="border border-amber-900/20 rounded bg-amber-50/30"
        />
        <div className="flex-1">
          <span className="font-serif font-bold text-sm text-amber-900 block mb-1">{title}</span>
          <p className="text-xs text-amber-800/70 font-serif">{description}</p>
        </div>
      </div>
    </div>
  )
}

interface StatusLegendItemProps {
  color: string
  label: string
  description: string
  status?: string
}

export function StatusLegendItem({ color, label, description, status }: StatusLegendItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !status) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawUnitStatus(ctx, { x: 35, y: 35 }, status as "fresh" | "engaged" | "wavering" | "routing", 28);
  }, [status]);

  return (
    <div className="text-center p-2 bg-white/40 rounded-lg border border-amber-900/10">
      <canvas 
        ref={canvasRef} 
        width={70} 
        height={70}
        className="mx-auto mb-2 border border-amber-900/20 rounded bg-amber-50/30"
      />
      <div className="font-serif font-bold text-xs text-amber-900">{label}</div>
      <div className="text-xs text-amber-800/60">{description}</div>
    </div>
  )
}

interface VisualEffectLegendItemProps {
  type: string
  description: string
}

export function VisualEffectLegendItem({ type, description }: VisualEffectLegendItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw effect visualization
    const centerLoc = { x: 50, y: 35 };
    
    renderVisualEffect(type, {
      ctx,
      location: centerLoc,
      opacity: 0.9,
    });
  }, [type]);

  return (
    <div className="p-2 bg-white/40 rounded-lg border border-amber-900/10">
      <canvas 
        ref={canvasRef} 
        width={100} 
        height={70}
        className="mx-auto mb-2 border border-amber-900/20 rounded bg-amber-50/30"
      />
      <div className="text-center">
        <div className="font-serif font-bold text-xs text-amber-900 mb-1">{type}</div>
        <p className="text-xs text-amber-800/60 font-serif">{description}</p>
      </div>
    </div>
  )
}
