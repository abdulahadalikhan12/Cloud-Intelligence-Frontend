import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, (n) => n.toFixed(decimals));
  const [text, setText] = useState("0");
  useEffect(() => { spring.set(value); }, [value, spring]);
  useEffect(() => display.on("change", (v) => setText(v)), [display]);
  return <span className="tabular-nums">{text}{suffix}</span>;
}
