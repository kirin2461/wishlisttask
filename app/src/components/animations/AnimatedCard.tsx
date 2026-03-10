import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'none';
}

const hoverEffects = {
  lift: 'hover:-translate-y-2 hover:shadow-2xl',
  glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]',
  scale: 'hover:scale-[1.02]',
  none: '',
};

export function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  hoverEffect = 'lift' 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ 
        y: hoverEffect === 'lift' ? -8 : 0,
        scale: hoverEffect === 'scale' ? 1.02 : 1,
        transition: { duration: 0.2 }
      }}
      className={`
        bg-white rounded-2xl shadow-lg border border-gray-100
        transition-shadow duration-300
        ${hoverEffects[hoverEffect]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.1 
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface PulseRingProps {
  children: ReactNode;
  color?: string;
}

export function PulseRing({ children, color = 'bg-purple-500' }: PulseRingProps) {
  return (
    <div className="relative">
      <motion.div
        className={`absolute inset-0 ${color} rounded-full opacity-30`}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={`absolute inset-0 ${color} rounded-full opacity-20`}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
