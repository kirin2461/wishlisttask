import { motion } from 'framer-motion';
import { Gift, Sparkles, Heart, Star } from 'lucide-react';

interface AnimatedGiftProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const sizes = {
  sm: { icon: 24, container: 'w-12 h-12' },
  md: { icon: 32, container: 'w-16 h-16' },
  lg: { icon: 48, container: 'w-24 h-24' },
  xl: { icon: 64, container: 'w-32 h-32' },
};

export function AnimatedGift({ size = 'md', animate = true }: AnimatedGiftProps) {
  const { icon, container } = sizes[size];

  return (
    <motion.div
      className={`relative ${container} flex items-center justify-center`}
      animate={animate ? {
        y: [0, -10, 0],
        rotate: [0, -5, 5, 0],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-50"
        animate={animate ? {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main icon container */}
      <motion.div
        className="relative z-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg"
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.95 }}
      >
        <Gift size={icon} className="text-white" />
      </motion.div>

      {/* Floating sparkles */}
      {animate && (
        <>
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0,
            }}
          >
            <Sparkles size={16} className="text-yellow-400" />
          </motion.div>

          <motion.div
            className="absolute -bottom-1 -left-2"
            animate={{
              scale: [0, 1, 0],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
            }}
          >
            <Star size={14} className="text-pink-400" />
          </motion.div>

          <motion.div
            className="absolute top-0 -left-3"
            animate={{
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
            }}
          >
            <Heart size={12} className="text-red-400" />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export function FloatingGifts() {
  const gifts = [
    { icon: Gift, color: 'from-purple-500 to-pink-500', delay: 0, x: '10%' },
    { icon: Heart, color: 'from-pink-500 to-rose-500', delay: 0.5, x: '30%' },
    { icon: Star, color: 'from-yellow-400 to-orange-500', delay: 1, x: '50%' },
    { icon: Sparkles, color: 'from-blue-400 to-purple-500', delay: 1.5, x: '70%' },
    { icon: Gift, color: 'from-green-400 to-teal-500', delay: 2, x: '90%' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {gifts.map((gift, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: gift.x, bottom: '-50px' }}
          animate={{
            y: [0, -window.innerHeight - 100],
            rotate: [0, 360],
            x: [0, Math.sin(i * 1.5) * 50, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: gift.delay,
            ease: 'linear',
          }}
        >
          <div className={`bg-gradient-to-br ${gift.color} p-3 rounded-xl shadow-lg opacity-60`}>
            <gift.icon size={24} className="text-white" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
