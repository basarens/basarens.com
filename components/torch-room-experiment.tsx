"use client";

import { useEffect, useRef } from "react";

const canvasWidth = 320;
const canvasHeight = 216;
const tileSize = 12;
const room = { left: 2, top: 1, width: 23, height: 16 };
const lightSwitch = { x: room.left + 2, y: room.top + room.height - 2 };
const doorTiles = new Set([
  `${room.left + Math.floor(room.width / 2)},${room.top}`,
  `${room.left + Math.floor(room.width / 2)},${room.top + room.height - 1}`,
  `${room.left},${room.top + Math.floor(room.height / 2)}`,
  `${room.left + room.width - 1},${room.top + Math.floor(room.height / 2)}`,
]);

const pillars = new Set([
  "7,5",
  "7,6",
  "7,10",
  "7,11",
  "19,5",
  "19,6",
  "19,10",
  "19,11",
]);

type Direction = "up" | "down" | "left" | "right";

function keyForDirection(direction: Direction) {
  return `touch-${direction}`;
}

export function TorchRoomExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressedKeys = useRef(new Set<string>());

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const drawingContext = context;

    const player = {
      x: (room.left + room.width / 2) * tileSize,
      y: (room.top + room.height / 2) * tileSize,
    };
    let lightsOn = false;
    let frameId = 0;
    let previousTime = performance.now();

    function tileKey(x: number, y: number) {
      return `${x},${y}`;
    }

    function isWalkable(x: number, y: number) {
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      const insideRoom =
        tileX > room.left &&
        tileX < room.left + room.width - 1 &&
        tileY > room.top &&
        tileY < room.top + room.height - 1;

      return insideRoom && !pillars.has(tileKey(tileX, tileY));
    }

    function draw(time: number) {
      drawingContext.fillStyle = "#030306";
      drawingContext.fillRect(0, 0, canvasWidth, canvasHeight);

      const flicker = Math.sin(time / 105) * 3 + Math.sin(time / 59) * 1.5;
      const torchRadius = 37 + flicker;
      const switchX = lightSwitch.x * tileSize + tileSize / 2;
      const switchY = lightSwitch.y * tileSize + tileSize / 2;

      for (let y = room.top; y < room.top + room.height; y += 1) {
        for (let x = room.left; x < room.left + room.width; x += 1) {
          const centerX = x * tileSize + tileSize / 2;
          const centerY = y * tileSize + tileSize / 2;
          const distance = Math.hypot(centerX - player.x, centerY - player.y);
          const torchLight = Math.max(0, 1 - distance / torchRadius);
          const light = lightsOn ? 1 : torchLight;
          const isDoor = doorTiles.has(tileKey(x, y));
          const isWall =
            !isDoor &&
            (x === room.left ||
              x === room.left + room.width - 1 ||
              y === room.top ||
              y === room.top + room.height - 1 ||
              pillars.has(tileKey(x, y)));
          if (light > 0.02) {
            if (isDoor) {
              drawingContext.fillStyle = "#20191d";
              drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              drawingContext.fillStyle = "#78583d";
              drawingContext.fillRect(x * tileSize + 2, y * tileSize + 1, tileSize - 4, tileSize - 2);
              drawingContext.fillStyle = "#2c2020";
              drawingContext.fillRect(x * tileSize + 4, y * tileSize + 3, 1, tileSize - 5);
              drawingContext.fillRect(x * tileSize + tileSize - 5, y * tileSize + 3, 1, tileSize - 5);
              drawingContext.fillStyle = "#f0bb50";
              drawingContext.fillRect(x * tileSize + tileSize - 4, y * tileSize + Math.floor(tileSize / 2), 1, 1);
            } else if (isWall) {
              const wallBrightness = Math.round(22 + light * 46);
              const wallVariation = (x * 11 + y * 23) % 3;
              drawingContext.fillStyle = `rgb(${wallBrightness + wallVariation * 3}, ${wallBrightness + wallVariation * 3 + 2}, ${wallBrightness + wallVariation * 3 + 7})`;
              drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              drawingContext.fillStyle = "rgba(10, 10, 13, 0.56)";
              drawingContext.fillRect(x * tileSize, y * tileSize + tileSize - 2, tileSize, 1);
              drawingContext.fillRect(x * tileSize + tileSize - 2, y * tileSize, 1, tileSize);
              if (light > 0.32) {
                drawingContext.fillStyle = "rgba(194, 189, 169, 0.28)";
                drawingContext.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 5, 1);
              }
            } else {
              const brightness = Math.round(16 + light * 57);
              const stoneVariation = (x * 17 + y * 29) % 3;
              drawingContext.fillStyle = `rgb(${brightness + 17 + stoneVariation * 4}, ${brightness + 12 + stoneVariation * 3}, ${brightness + 2})`;
              drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

              if (light > 0.12) {
                drawingContext.fillStyle = "rgba(11, 10, 14, 0.48)";
                drawingContext.fillRect(x * tileSize + 1, y * tileSize + tileSize - 2, tileSize - 2, 1);
                drawingContext.fillRect(x * tileSize + tileSize - 2, y * tileSize + 1, 1, tileSize - 3);

                const detail = (x * 31 + y * 13) % 7;
                if (detail === 0 || detail === 3) {
                  drawingContext.fillStyle = "rgba(98, 132, 64, 0.72)";
                  drawingContext.fillRect(x * tileSize + 4, y * tileSize + 6, 1, 4);
                  drawingContext.fillRect(x * tileSize + 5, y * tileSize + 7, 2, 1);
                  drawingContext.fillRect(x * tileSize + 3, y * tileSize + 8, 1, 1);
                } else if (detail === 5) {
                  drawingContext.fillStyle = "rgba(31, 25, 29, 0.68)";
                  drawingContext.fillRect(x * tileSize + 4, y * tileSize + 4, 3, 1);
                  drawingContext.fillRect(x * tileSize + 6, y * tileSize + 5, 1, 3);
                }
              }
            }
          }
        }
      }

      const switchIsVisible = lightsOn || Math.hypot(switchX - player.x, switchY - player.y) < torchRadius;
      if (switchIsVisible) {
        const switchLeft = lightSwitch.x * tileSize + 3;
        const switchTop = lightSwitch.y * tileSize + 2;
        drawingContext.fillStyle = "#1d1d23";
        drawingContext.fillRect(switchLeft - 1, switchTop - 1, 8, 10);
        drawingContext.fillStyle = "#b9b7ad";
        drawingContext.fillRect(switchLeft, switchTop, 6, 8);
        drawingContext.fillStyle = lightsOn ? "#5edb75" : "#d55945";
        drawingContext.fillRect(switchLeft + 2, switchTop + (lightsOn ? 1 : 4), 2, 3);
      }

      drawingContext.fillStyle = "#fbce55";
      drawingContext.fillRect(Math.round(player.x - 3), Math.round(player.y - 5), 6, 8);
      drawingContext.fillStyle = "#fff6c7";
      drawingContext.fillRect(Math.round(player.x - 1), Math.round(player.y - 7), 2, 3);
      drawingContext.fillStyle = "#6f2631";
      drawingContext.fillRect(Math.round(player.x - 2), Math.round(player.y + 3), 4, 3);

      drawingContext.fillStyle = "#fff6c7";
      drawingContext.font = "7px monospace";
      drawingContext.fillText("ROOM_01", 12, 13);
      drawingContext.fillStyle = "#fdc32d";
      drawingContext.fillText(lightsOn ? "LIGHT" : "TORCH", 252, 13);
      drawingContext.fillStyle = lightsOn ? "#5edb75" : "#ff6c37";
      drawingContext.fillRect(289, 7, 19, 5);
    }

    function update(time: number) {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const horizontal =
        Number(pressedKeys.current.has("ArrowRight") || pressedKeys.current.has("d") || pressedKeys.current.has(keyForDirection("right"))) -
        Number(pressedKeys.current.has("ArrowLeft") || pressedKeys.current.has("a") || pressedKeys.current.has(keyForDirection("left")));
      const vertical =
        Number(pressedKeys.current.has("ArrowDown") || pressedKeys.current.has("s") || pressedKeys.current.has(keyForDirection("down"))) -
        Number(pressedKeys.current.has("ArrowUp") || pressedKeys.current.has("w") || pressedKeys.current.has(keyForDirection("up")));
      const length = Math.hypot(horizontal, vertical) || 1;
      const speed = 68;
      const nextX = player.x + (horizontal / length) * speed * delta;
      const nextY = player.y + (vertical / length) * speed * delta;

      if (horizontal && isWalkable(nextX, player.y)) player.x = nextX;
      if (vertical && isWalkable(player.x, nextY)) player.y = nextY;

      draw(time);
      frameId = requestAnimationFrame(update);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (event.code === "Space" && !event.repeat) {
        const switchX = lightSwitch.x * tileSize + tileSize / 2;
        const switchY = lightSwitch.y * tileSize + tileSize / 2;
        event.preventDefault();
        if (Math.hypot(switchX - player.x, switchY - player.y) < tileSize * 1.5) {
          lightsOn = !lightsOn;
        }
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        pressedKeys.current.add(event.key.startsWith("Arrow") ? event.key : key);
        event.preventDefault();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      pressedKeys.current.delete(event.key.startsWith("Arrow") ? event.key : event.key.toLowerCase());
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  function setDirection(direction: Direction, isMoving: boolean) {
    const key = keyForDirection(direction);
    if (isMoving) pressedKeys.current.add(key);
    else pressedKeys.current.delete(key);
  }

  return (
    <section className="flex flex-1 flex-col p-3 sm:p-5">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-4 sm:py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#fdc32d]">
              The dark room
            </p>
            <h1
              className="mt-2 text-2xl text-[#fff6c7] sm:text-3xl"
              style={{ fontFamily: "var(--font-press-start)" }}
            >
              Torch test
            </h1>
          </div>
          <p className="max-w-xs text-right font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-white/45 sm:text-[10px]">
            Loop met WASD of pijltjes.<br />
            Vind de schakelaar. Druk spatie.
          </p>
        </div>

        <div className="relative overflow-hidden border-4 border-[#31202a] bg-black shadow-[0_0_0_4px_#8f3e30,10px_12px_0_#030306]">
          <canvas
            aria-label="Een donkere pixelkamer waarin je met een fakkel rondloopt"
            className="block h-auto w-full [image-rendering:pixelated]"
            height={canvasHeight}
            ref={canvasRef}
            tabIndex={0}
            width={canvasWidth}
          />
        </div>

        <div className="mx-auto mt-7 grid w-40 grid-cols-3 gap-2 sm:hidden">
          <span />
          <DirectionButton direction="up" onMove={setDirection}>↑</DirectionButton>
          <span />
          <DirectionButton direction="left" onMove={setDirection}>←</DirectionButton>
          <DirectionButton direction="down" onMove={setDirection}>↓</DirectionButton>
          <DirectionButton direction="right" onMove={setDirection}>→</DirectionButton>
        </div>
      </div>
    </section>
  );
}

function DirectionButton({
  children,
  direction,
  onMove,
}: {
  children: React.ReactNode;
  direction: Direction;
  onMove: (direction: Direction, isMoving: boolean) => void;
}) {
  return (
    <button
      className="grid aspect-square place-items-center border-2 border-[#8f3e30] bg-[#1a1015] font-mono text-xl text-[#fdc32d] active:translate-y-0.5 active:bg-[#6f2631]"
      onPointerCancel={() => onMove(direction, false)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onMove(direction, true);
      }}
      onPointerUp={() => onMove(direction, false)}
      type="button"
    >
      {children}
    </button>
  );
}
