"use client"

import { motion } from "framer-motion"
import React, { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"

export interface ContainerTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[]
  /** Time in milliseconds between word transitions */
  interval?: number
  /** Additional CSS classes to apply to the container */
  className?: string
  /** Additional CSS classes to apply to the text */
  textClassName?: string
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number
}

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 3000,
  className,
  textClassName,
  animationDuration = 700,
}: ContainerTextFlipProps) {
  const id = useId()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [width, setWidth] = useState<number | "auto">("auto") // Initialize with auto
  const textRef = React.useRef<HTMLDivElement>(null)

  const updateWidthForWord = () => {
    if (textRef.current) {
      // Add padding to text width to perfectly match neo-brutalist border
      const textWidth = textRef.current.scrollWidth + 32
      setWidth(textWidth)
    }
  }

  useEffect(() => {
    // Initial width sizing before word change hook catches it
    setTimeout(updateWidthForWord, 50); 
  }, []);

  useEffect(() => {
    // Update width whenever the word changes
    updateWidthForWord()
  }, [currentWordIndex])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex(prevIndex => (prevIndex + 1) % words.length)
      // Width will be updated in the effect that depends on currentWordIndex
    }, interval)

    return () => clearInterval(intervalId)
  }, [words, interval])

  return (
    <motion.div
      animate={{ width }}
      className={cn(
        "relative inline-block text-center rounded-base px-2 py-1.5 min-w-[120px]",
        "text-lg sm:text-xl font-heading font-bold text-foreground [font-family:var(--font-space-grotesk)]",
        "border-2 border-border bg-secondary shadow-sm",
        className,
      )}
      key={words[currentWordIndex]}
      layout
      layoutId={`words-here-${id}`}
      transition={{ duration: animationDuration / 2000 }}
    >
      <motion.div
        className={cn("inline-block whitespace-nowrap overflow-visible", textClassName)}
        layoutId={`word-div-${words[currentWordIndex]}-${id}`}
        ref={textRef}
        transition={{
          duration: animationDuration / 1000,
          ease: "easeInOut",
        }}
        style={{ display: "inline-block" }}
      >
        <motion.div className="inline-block whitespace-nowrap">
          {words[currentWordIndex].split("").map((letter, index) => (
            <motion.span
              animate={{
                opacity: 1,
                filter: "blur(0px)",
              }}
              initial={{
                opacity: 0,
                filter: "blur(10px)",
              }}
              key={index}
              transition={{
                delay: index * 0.02,
              }}
              className="inline-block whitespace-pre"
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default ContainerTextFlip
