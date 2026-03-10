import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#f97316'];

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));
      setPieces(newPieces);

      setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="fixed w-3 h-3 rounded-sm z-50"
          style={{
            left: `${piece.x}%`,
            top: '-10px',
            backgroundColor: piece.color,
          }}
          initial={{
            y: -10,
            rotate: 0,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 10,
            rotate: piece.rotation + 720,
            scale: piece.scale,
            opacity: [1, 1, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2.5 + Math.random() * 1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </AnimatePresence>
  );
}

export function CelebrationBurst({ children, onCelebrate }: { children: React.ReactNode; onCelebrate?: () => void }) {
  const [bursting, setBursting] = useState(false);

  const handleClick = () => {
    setBursting(true);
    onCelebrate?.();
    setTimeout(() => setBursting(false), 100);
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
    >
      <Confetti trigger={bursting} />
      {children}
    </motion.div>
  );
}
