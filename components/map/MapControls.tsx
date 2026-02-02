"use client"
import { ZoomIn, ZoomOut } from "lucide-react"

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  scale: number
}

export function MapControls({ onZoomIn, onZoomOut, onResetView, scale }: MapControlsProps) {
  return (
    <div className="absolute top-16 right-4 flex flex-col gap-2 bg-white/80 backdrop-blur rounded-lg shadow border border-stone-200 p-1 z-20">
      <button 
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold"
      >+</button>
      <div className="text-xs text-center text-stone-400 font-mono">{Math.round(scale * 100)}%</div>
      <button 
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold"
      >-</button>
      <button 
         onClick={onResetView}
         className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded text-stone-700 font-bold text-xs"
         title="Reset View"
      >R</button>
    </div>
  )
}
