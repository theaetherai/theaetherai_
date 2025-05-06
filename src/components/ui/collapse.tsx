'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CollapseProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export function Collapse({ children, isOpen }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 