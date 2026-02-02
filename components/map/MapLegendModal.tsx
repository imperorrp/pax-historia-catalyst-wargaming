"use client"
import { motion } from "framer-motion"
import { LegendItem, StatusLegendItem, VisualEffectLegendItem } from "./MapLegend"

interface MapLegendModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MapLegendModal({ isOpen, onClose }: MapLegendModalProps) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-amber-50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-amber-900/20 backdrop-blur-sm"
      >
        <div className="p-6">
          <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">Visual Action Legend</h2>
          <p className="text-amber-800/80 text-sm mb-6 font-serif">
            Tactical arrows and symbols show the nature of military operations when you select a strategy.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LegendItem 
              title="ADVANCE" 
              action="ADVANCE" 
              description="Straight arrow - Forward movement"
            />
            <LegendItem 
              title="ASSAULT" 
              action="ASSAULT" 
              description="Thick arrow with bar - Direct attack"
            />
            <LegendItem 
              title="FLANK LEFT" 
              action="FLANK_LEFT" 
              description="Curved arrow - Left flanking"
            />
            <LegendItem 
              title="FLANK RIGHT" 
              action="FLANK_RIGHT" 
              description="Curved arrow - Right flanking"
            />
            <LegendItem 
              title="ENCIRCLE" 
              action="ENCIRCLE" 
              description="Dual curved arrows - Surround"
            />
            <LegendItem 
              title="BOMBARD" 
              action="BOMBARD" 
              description="Starburst - Artillery fire"
            />
            <LegendItem 
              title="SUPPRESS" 
              action="SUPPRESS" 
              description="Cone of dots - Suppressive fire"
            />
            <LegendItem 
              title="FORTIFY" 
              action="FORTIFY" 
              description="Sawtooth line - Defensive positions"
            />
            <LegendItem 
              title="RETREAT" 
              action="RETREAT" 
              description="Dashed arrow - Withdrawal"
            />
            <LegendItem 
              title="INFILTRATE" 
              action="INFILTRATE" 
              description="Serpentine - Stealth movement"
            />
            <LegendItem 
              title="AMBUSH" 
              action="AMBUSH" 
              description="Question mark - Hidden forces"
            />
            <LegendItem 
              title="SPEARHEAD" 
              action="SPEARHEAD" 
              description="Bold arrow - Breakthrough"
            />
            <LegendItem 
              title="FEINT" 
              action="FEINT" 
              description="Phantom arrow - Deception"
            />
            <LegendItem 
              title="PROBE" 
              action="RECON" 
              description="Dotted arrow - Reconnaissance"
            />
            <LegendItem 
              title="CHARGE" 
              action="TRAMPLE" 
              description="Triple arrows - Cavalry charge"
            />
            <LegendItem 
              title="HOLD" 
              action="HOLD" 
              description="Circle barrier - Hold position"
            />
            <LegendItem 
              title="AIRSTRIKE" 
              action="AIRSTRIKE" 
              description="Aircraft icon - Air bombardment"
            />
            <LegendItem 
              title="COMBINED ASSAULT" 
              action="COMBINED_ASSAULT" 
              description="Multiple arrows - Coordinated attack"
            />
            <LegendItem 
              title="HACK" 
              action="HACK" 
              description="Circuit pattern - Cyber warfare"
            />
            <LegendItem 
              title="NAVAL RAM" 
              action="NAVAL_RAM" 
              description="Ship ramming - Naval combat"
            />
            <LegendItem 
              title="FIRE SHIP" 
              action="FIRE_SHIP" 
              description="Burning ship - Incendiary naval attack"
            />
            <LegendItem 
              title="RAIN ARROWS" 
              action="RAIN_ARROWS" 
              description="Arrow shower - Mass archery"
            />
            <LegendItem 
              title="BROADSIDES" 
              action="BROADSIDES" 
              description="Cannon barrage - Ship gunfire"
            />
            <LegendItem 
              title="RAKING FIRE" 
              action="RAKING_FIRE" 
              description="Lengthwise cannonade - Naval tactic"
            />
            <LegendItem 
              title="BOARDING" 
              action="BOARDING" 
              description="Grappling hooks - Ship boarding"
            />
            <LegendItem 
              title="MANEUVER" 
              action="MANEUVER" 
              description="Curved path - Tactical movement"
            />
            <LegendItem 
              title="LINE OF BATTLE" 
              action="LINE_OF_BATTLE" 
              description="Ship formation - Naval formation"
            />
          </div>
          
          <div className="mt-6 pt-4 border-t border-amber-900/20">
            <h3 className="font-serif font-bold text-amber-900 mb-3">Visual Effects</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <VisualEffectLegendItem type="DUST" description="Troop movement dust clouds" />
              <VisualEffectLegendItem type="EXPLOSION" description="Artillery impact burst" />
              <VisualEffectLegendItem type="SMOKE" description="Battlefield smoke" />
              <VisualEffectLegendItem type="FIRE" description="Burning structures" />
              <VisualEffectLegendItem type="IMPACT" description="Direct hit marker" />
              <VisualEffectLegendItem type="MUD_SPLAT" description="Muddy terrain effect" />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-amber-900/20">
            <h3 className="font-serif font-bold text-amber-900 mb-3">Unit Status Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatusLegendItem color="#27ae60" label="Fresh" description="Solid ring" status="fresh" />
              <StatusLegendItem color="#e67e22" label="Engaged" description="Short dashes" status="engaged" />
              <StatusLegendItem color="#e74c3c" label="Wavering" description="Long dashes" status="wavering" />
              <StatusLegendItem color="#95a5a6" label="Routing" description="Faded blur" status="routing" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}