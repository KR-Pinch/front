import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface HeartBurstProps {
  show: boolean;
}

// Decorative burst rendered behind the like button on like
const HeartBurst = ({ show }: HeartBurstProps) => {
  if (!show) return null;
  const particles = Array.from({ length: 6 });
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 22;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <motion.span
            key={i}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x, y, scale: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <Heart className="h-3 w-3 fill-accent text-accent" />
          </motion.span>
        );
      })}
      <motion.span
        className="absolute h-8 w-8 rounded-full bg-accent/30"
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </span>
  );
};

export default HeartBurst;
