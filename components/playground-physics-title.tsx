"use client";

import { useEffect, useRef, useState } from "react";
import type Matter from "matter-js";

type PhysicsInstance = {
  stop: () => void;
};

const mouseMediaQuery = "(hover: hover) and (pointer: fine)";

export function PlaygroundPhysicsTitle({ title }: { title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const letterRefs = useRef(new Map<number, HTMLSpanElement>());
  const matterRef = useRef<typeof Matter | null>(null);
  const physicsRef = useRef<PhysicsInstance | null>(null);
  const isHoveringRef = useRef(false);
  const [isPhysicsActive, setIsPhysicsActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const titleElement = titleRef.current;
    const card = canvas?.closest<HTMLElement>("[data-physics-playground-card]");

    if (!canvas || !titleElement || !card) return;

    const physicsCanvas = canvas;
    const physicsTitle = titleElement;
    const physicsCard = card;

    function stopPhysics() {
      physicsRef.current?.stop();
      physicsRef.current = null;
      setIsPhysicsActive(false);
    }

    async function startPhysics() {
      if (!window.matchMedia(mouseMediaQuery).matches || physicsRef.current) return;

      isHoveringRef.current = true;
      const Matter = matterRef.current ?? (await import("matter-js")).default;

      matterRef.current = Matter;
      if (!isHoveringRef.current || physicsRef.current) return;

      const cardBounds = physicsCard.getBoundingClientRect();
      const titleStyle = window.getComputedStyle(physicsTitle);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(cardBounds.width);
      const height = Math.round(cardBounds.height);

      physicsCanvas.width = width * pixelRatio;
      physicsCanvas.height = height * pixelRatio;
      physicsCanvas.style.width = `${width}px`;
      physicsCanvas.style.height = `${height}px`;

      const context = physicsCanvas.getContext("2d");
      if (!context) return;

      const drawingContext = context;

      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawingContext.font = `${titleStyle.fontWeight} ${titleStyle.fontSize} ${titleStyle.fontFamily}`;
      drawingContext.fillStyle = titleStyle.color;
      drawingContext.textAlign = "center";
      drawingContext.textBaseline = "middle";

      const engine = Matter.Engine.create({
        gravity: { x: 0, y: 1.25, scale: 0.0018 },
      });
      const { Bodies, Composite, Engine } = Matter;
      const walls = [
        Bodies.rectangle(width / 2, height + 14, width + 80, 28, {
          isStatic: true,
          restitution: 0.15,
        }),
        Bodies.rectangle(-14, height / 2, 28, height * 2, { isStatic: true }),
        Bodies.rectangle(width + 14, height / 2, 28, height * 2, { isStatic: true }),
      ];

      const letters = Array.from(title).flatMap((character, index) => {
        const letter = letterRefs.current.get(index);
        if (!letter || character === " ") return [];

        const bounds = letter.getBoundingClientRect();
        const letterWidth = Math.max(bounds.width, 18);
        const letterHeight = Math.max(bounds.height, 28);
        const body = Bodies.rectangle(
          bounds.left - cardBounds.left + letterWidth / 2,
          bounds.top - cardBounds.top + letterHeight / 2,
          letterWidth * 0.88,
          letterHeight * 0.82,
          {
            friction: 0.04,
            frictionAir: 0.012,
            restitution: 0.35,
            density: 0.0015,
          },
        );

        return [{ body, character }];
      });

      Composite.add(engine.world, [...walls, ...letters.map(({ body }) => body)]);
      setIsPhysicsActive(true);

      let frameId = 0;
      let previousTime = performance.now();
      const startedAt = previousTime;

      function draw() {
        drawingContext.clearRect(0, 0, width, height);

        letters.forEach(({ body, character }) => {
          drawingContext.save();
          drawingContext.translate(body.position.x, body.position.y);
          drawingContext.rotate(body.angle);
          drawingContext.fillText(character, 0, 1);
          drawingContext.restore();
        });
      }

      function update(time: number) {
        const delta = Math.min(time - previousTime, 32);
        previousTime = time;
        Engine.update(engine, delta);
        draw();

        if (isHoveringRef.current && time - startedAt < 2600) {
          frameId = requestAnimationFrame(update);
        }
      }

      frameId = requestAnimationFrame(update);
      physicsRef.current = {
        stop: () => {
          cancelAnimationFrame(frameId);
          Composite.clear(engine.world, false, true);
          Engine.clear(engine);
          drawingContext.clearRect(0, 0, width, height);
        },
      };
    }

    function handleMouseEnter() {
      void startPhysics();
    }

    function handleMouseLeave() {
      isHoveringRef.current = false;
      stopPhysics();
    }

    physicsCard.addEventListener("mouseenter", handleMouseEnter);
    physicsCard.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      physicsCard.removeEventListener("mouseenter", handleMouseEnter);
      physicsCard.removeEventListener("mouseleave", handleMouseLeave);
      isHoveringRef.current = false;
      stopPhysics();
    };
  }, [title]);

  return (
    <div>
      <h2
        aria-label={title}
        className={`mt-2 text-4xl font-semibold leading-none tracking-[-0.075em] transition-opacity sm:text-6xl ${
          isPhysicsActive ? "opacity-0" : "opacity-100"
        }`}
        ref={titleRef}
      >
        {Array.from(title).map((character, index) => (
          <span
            aria-hidden="true"
            className="inline-block"
            key={`${character}-${index}`}
            ref={(element) => {
              if (element) letterRefs.current.set(index, element);
              else letterRefs.current.delete(index);
            }}
          >
            {character === " " ? "\u00a0" : character}
          </span>
        ))}
      </h2>
      <canvas
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-150 ${
          isPhysicsActive ? "opacity-100" : "opacity-0"
        }`}
        ref={canvasRef}
      />
    </div>
  );
}
