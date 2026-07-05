'use client';

import { motion } from 'framer-motion';

export function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(75,160,250,0.15) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(54,253,253,0.06) 0%, transparent 50%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <div className="absolute inset-0 bg-[#05080D]/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(105,167,240,0.2)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
    </div>
  );
}
