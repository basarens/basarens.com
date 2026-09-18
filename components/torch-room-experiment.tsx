"use client";

import { useEffect, useRef } from "react";

const canvasWidth = 312;
const canvasHeight = 216;
const tileSize = 12;
const room = { left: 2, top: 2, width: 22, height: 14 };
const lightSwitch = { x: room.left + 2, y: room.top + room.height - 1 };
type DoorDirection = "north" | "east" | "south" | "west";
type RoomId = "chamber" | "brook" | "castle" | "hall" | "wood" | "forge" | "crypt";
type RoomTheme = "chamber" | "brook" | "castle" | "hall" | "wood" | "forge" | "crypt";

type RoomSpec = {
  code: string;
  name: string;
  theme: RoomTheme;
  exits: Partial<Record<DoorDirection, RoomId>>;
};

const directions: DoorDirection[] = ["north", "east", "south", "west"];
const oppositeDirection: Record<DoorDirection, DoorDirection> = {
  north: "south",
  east: "west",
  south: "north",
  west: "east",
};
const doorRotations: Record<DoorDirection, number> = {
  north: 0,
  east: Math.PI / 2,
  south: Math.PI,
  west: -Math.PI / 2,
};
const rooms: Record<RoomId, RoomSpec> = {
  chamber: {
    code: "ROOM_01",
    name: "The torch room",
    theme: "chamber",
    exits: { north: "brook", east: "wood", south: "forge", west: "crypt" },
  },
  brook: {
    code: "ROOM_02",
    name: "Moonbrook bridge",
    theme: "brook",
    exits: { north: "castle", south: "chamber" },
  },
  castle: {
    code: "ROOM_03",
    name: "Castle approach",
    theme: "castle",
    exits: { north: "hall", south: "brook" },
  },
  hall: {
    code: "ROOM_04",
    name: "The great hall",
    theme: "hall",
    exits: { south: "castle" },
  },
  wood: {
    code: "ROOM_05",
    name: "Whispering wood",
    theme: "wood",
    exits: { west: "chamber" },
  },
  forge: {
    code: "ROOM_06",
    name: "The old forge",
    theme: "forge",
    exits: { north: "chamber" },
  },
  crypt: {
    code: "ROOM_07",
    name: "Forgotten crypt",
    theme: "crypt",
    exits: { east: "chamber" },
  },
};

const chamberPillars = new Set([
  "7,5",
  "7,6",
  "7,11",
  "7,12",
  "18,5",
  "18,6",
  "18,11",
  "18,12",
]);

type Direction = "up" | "down" | "left" | "right";

function keyForDirection(direction: Direction) {
  return `touch-${direction}`;
}

function tileKey(x: number, y: number) {
  return `${x},${y}`;
}

function doorPosition(direction: DoorDirection) {
  const middleX = room.left + Math.floor(room.width / 2);
  const middleY = room.top + Math.floor(room.height / 2);

  if (direction === "north") return { x: middleX, y: room.top };
  if (direction === "east") return { x: room.left + room.width - 1, y: middleY };
  if (direction === "south") return { x: middleX, y: room.top + room.height - 1 };
  return { x: room.left, y: middleY };
}

function doorAt(roomSpec: RoomSpec, x: number, y: number) {
  return directions.find((direction) => {
    const door = doorPosition(direction);
    return roomSpec.exits[direction] && door.x === x && door.y === y;
  });
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
    let activeRoomId: RoomId = "chamber";
    const litRooms = new Set<RoomId>();
    let frameId = 0;
    let previousTime = performance.now();

    function isWater(roomSpec: RoomSpec, x: number, y: number) {
      const streamY = room.top + 6;
      return roomSpec.theme === "brook" && (y === streamY || y === streamY + 1);
    }

    function isBridge(roomSpec: RoomSpec, x: number, y: number) {
      const bridgeLeft = room.left + Math.floor(room.width / 2) - 1;
      return roomSpec.theme === "brook" && isWater(roomSpec, x, y) && x >= bridgeLeft && x <= bridgeLeft + 3;
    }

    function isObstacle(roomSpec: RoomSpec, x: number, y: number) {
      const key = tileKey(x, y);
      if (roomSpec.theme === "chamber") return chamberPillars.has(key);
      if (roomSpec.theme === "wood") return ["7,5", "8,5", "7,6", "17,10", "18,10", "18,11"].includes(key);
      if (roomSpec.theme === "forge") return ["8,8", "9,8", "17,6", "17,7"].includes(key);
      if (roomSpec.theme === "hall") return ["10,8", "11,8", "12,8", "13,8", "14,8"].includes(key);
      if (roomSpec.theme === "crypt") return ["8,6", "9,6", "15,10", "16,10"].includes(key);
      return false;
    }

    function isWalkable(x: number, y: number) {
      const tileX = Math.floor(x / tileSize);
      const tileY = Math.floor(y / tileSize);
      const activeRoom = rooms[activeRoomId];
      if (doorAt(activeRoom, tileX, tileY)) return true;
      const insideRoom =
        tileX > room.left &&
        tileX < room.left + room.width - 1 &&
        tileY > room.top &&
        tileY < room.top + room.height - 1;

      return (
        insideRoom &&
        !isObstacle(activeRoom, tileX, tileY) &&
        (!isWater(activeRoom, tileX, tileY) || isBridge(activeRoom, tileX, tileY))
      );
    }

    function placePlayerAtEntrance(exitDirection: DoorDirection) {
      const entryDirection = oppositeDirection[exitDirection];
      const door = doorPosition(entryDirection);
      const inset = tileSize * 1.5;
      player.x = door.x * tileSize + tileSize / 2;
      player.y = door.y * tileSize + tileSize / 2;
      if (entryDirection === "north") player.y += inset;
      if (entryDirection === "east") player.x -= inset;
      if (entryDirection === "south") player.y -= inset;
      if (entryDirection === "west") player.x += inset;
    }

    function moveThroughDoor() {
      const activeRoom = rooms[activeRoomId];
      const direction = doorAt(activeRoom, Math.floor(player.x / tileSize), Math.floor(player.y / tileSize));
      const nextRoomId = direction ? activeRoom.exits[direction] : undefined;

      if (direction && nextRoomId) {
        activeRoomId = nextRoomId;
        placePlayerAtEntrance(direction);
      }
    }

    function drawDoor(x: number, y: number, direction: DoorDirection) {
      const rotation = doorRotations[direction];
      const centerX = x * tileSize + tileSize / 2;
      const centerY = y * tileSize + tileSize / 2;

      drawingContext.fillStyle = "#20191d";
      drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      drawingContext.save();
      drawingContext.translate(centerX, centerY);
      drawingContext.rotate(rotation);
      drawingContext.fillStyle = "#78583d";
      drawingContext.fillRect(-4, -5, 8, 10);
      drawingContext.fillStyle = "#2c2020";
      drawingContext.fillRect(-2, -3, 1, 5);
      drawingContext.fillRect(1, -3, 1, 5);
      drawingContext.fillStyle = "#f0bb50";
      drawingContext.fillRect(2, 0, 1, 1);
      drawingContext.restore();
    }

    function draw(time: number) {
      drawingContext.fillStyle = "#030306";
      drawingContext.fillRect(0, 0, canvasWidth, canvasHeight);

      const activeRoom = rooms[activeRoomId];
      const lightsOn = litRooms.has(activeRoomId);
      const flicker = Math.sin(time / 105) * 3 + Math.sin(time / 59) * 1.5;
      const torchRadius = 37 + flicker;
      const switchX = lightSwitch.x * tileSize + tileSize / 2;
      const switchY = lightSwitch.y * tileSize + tileSize / 2;

      for (let y = room.top; y < room.top + room.height; y += 1) {
        for (let x = room.left; x < room.left + room.width; x += 1) {
          const centerX = x * tileSize + tileSize / 2;
          const centerY = y * tileSize + tileSize / 2;
          const torchLight = Math.max(0, 1 - Math.hypot(centerX - player.x, centerY - player.y) / torchRadius);
          const light = lightsOn ? 1 : torchLight;
          if (light <= 0.02) continue;

          const direction = doorAt(activeRoom, x, y);
          const obstacle = isObstacle(activeRoom, x, y);
          const isWall =
            !direction &&
            (x === room.left ||
              x === room.left + room.width - 1 ||
              y === room.top ||
              y === room.top + room.height - 1 ||
              obstacle);

          if (direction) {
            drawDoor(x, y, direction);
            continue;
          }

          if (isWall) {
            const wallBrightness = Math.round(24 + light * 47);
            const wallVariation = (x * 11 + y * 23) % 3;
            drawingContext.fillStyle = `rgb(${wallBrightness + wallVariation * 3}, ${wallBrightness + wallVariation * 3 + 2}, ${wallBrightness + wallVariation * 3 + 7})`;
            drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            drawingContext.fillStyle = "rgba(10, 10, 13, 0.56)";
            drawingContext.fillRect(x * tileSize, y * tileSize + tileSize - 2, tileSize, 1);
            drawingContext.fillRect(x * tileSize + tileSize - 2, y * tileSize, 1, tileSize);

            if (obstacle && activeRoom.theme === "wood") {
              drawingContext.fillStyle = "#31533a";
              drawingContext.fillRect(x * tileSize + 2, y * tileSize + 2, 8, 7);
              drawingContext.fillStyle = "#6b4328";
              drawingContext.fillRect(x * tileSize + 5, y * tileSize + 7, 2, 5);
            } else if (obstacle && activeRoom.theme === "forge") {
              drawingContext.fillStyle = "#ff9b43";
              drawingContext.fillRect(x * tileSize + 4, y * tileSize + 3, 4, 5);
            } else if (obstacle && activeRoom.theme === "hall") {
              drawingContext.fillStyle = "#76513c";
              drawingContext.fillRect(x * tileSize + 1, y * tileSize + 4, 10, 4);
            } else if (obstacle && activeRoom.theme === "crypt") {
              drawingContext.fillStyle = "#746987";
              drawingContext.fillRect(x * tileSize + 2, y * tileSize + 3, 8, 7);
            }
            continue;
          }

          const variation = (x * 17 + y * 29) % 3;
          const driveway = x >= room.left + 9 && x <= room.left + 12;
          let red = 59 + variation * 4;
          let green = 50 + variation * 3;
          let blue = 36 + variation * 2;
          if (activeRoom.theme === "brook") {
            if (isWater(activeRoom, x, y)) {
              red = 18 + variation * 2;
              green = 63 + variation * 4;
              blue = 92 + variation * 5;
            } else {
              red = 44 + variation * 3;
              green = 68 + variation * 4;
              blue = 33 + variation * 2;
            }
          } else if (activeRoom.theme === "castle") {
            red = driveway ? 75 + variation * 4 : 43 + variation * 3;
            green = driveway ? 71 + variation * 4 : 66 + variation * 4;
            blue = driveway ? 62 + variation * 4 : 34 + variation * 2;
          } else if (activeRoom.theme === "hall") {
            red = 78 + variation * 4;
            green = 38 + variation * 2;
            blue = 33 + variation * 2;
          } else if (activeRoom.theme === "wood") {
            red = 34 + variation * 3;
            green = 64 + variation * 4;
            blue = 32 + variation * 2;
          } else if (activeRoom.theme === "forge") {
            red = 59 + variation * 3;
            green = 43 + variation * 3;
            blue = 35 + variation * 2;
          } else if (activeRoom.theme === "crypt") {
            red = 54 + variation * 3;
            green = 45 + variation * 3;
            blue = 67 + variation * 4;
          }
          const brightness = 0.35 + light * 0.65;
          drawingContext.fillStyle = `rgb(${Math.round(red * brightness)}, ${Math.round(green * brightness)}, ${Math.round(blue * brightness)})`;
          drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

          if (light > 0.12) {
            drawingContext.fillStyle = "rgba(11, 10, 14, 0.48)";
            drawingContext.fillRect(x * tileSize + 1, y * tileSize + tileSize - 2, tileSize - 2, 1);
            drawingContext.fillRect(x * tileSize + tileSize - 2, y * tileSize + 1, 1, tileSize - 3);
            if (activeRoom.theme === "brook" && isWater(activeRoom, x, y)) {
              drawingContext.fillStyle = "rgba(184, 228, 229, 0.55)";
              drawingContext.fillRect(x * tileSize + 3, y * tileSize + (variation % 5) + 3, 5, 1);
            } else if (isBridge(activeRoom, x, y)) {
              drawingContext.fillStyle = "#a77642";
              drawingContext.fillRect(x * tileSize + 1, y * tileSize + 2, 10, 8);
              drawingContext.fillStyle = "#53321d";
              drawingContext.fillRect(x * tileSize + 2, y * tileSize + 4, 8, 1);
              drawingContext.fillRect(x * tileSize + 2, y * tileSize + 8, 8, 1);
            } else if ((x * 31 + y * 13) % 7 < 2) {
              drawingContext.fillStyle = "rgba(98, 132, 64, 0.72)";
              drawingContext.fillRect(x * tileSize + 4, y * tileSize + 6, 1, 4);
              drawingContext.fillRect(x * tileSize + 5, y * tileSize + 7, 2, 1);
            }
          }
        }
      }

      const switchIsVisible =
        activeRoomId === "chamber" &&
        (lightsOn || Math.hypot(switchX - player.x, switchY - player.y) < torchRadius);
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
      drawingContext.fillText(activeRoom.code, 12, 13);
      drawingContext.fillStyle = "rgba(255, 246, 199, 0.62)";
      drawingContext.fillText(activeRoom.name.toUpperCase(), 12, 23);
      drawingContext.fillStyle = "#fdc32d";
      drawingContext.fillText(lightsOn ? "LIGHT" : "TORCH", canvasWidth - 68, 13);
      drawingContext.fillStyle = lightsOn ? "#5edb75" : "#ff6c37";
      drawingContext.fillRect(canvasWidth - 31, 7, 19, 5);
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
      moveThroughDoor();

      draw(time);
      frameId = requestAnimationFrame(update);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (event.code === "Space" && !event.repeat) {
        const switchX = lightSwitch.x * tileSize + tileSize / 2;
        const switchY = lightSwitch.y * tileSize + tileSize / 2;
        event.preventDefault();
        if (
          activeRoomId === "chamber" &&
          Math.hypot(switchX - player.x, switchY - player.y) < tileSize * 1.5
        ) {
          if (litRooms.has(activeRoomId)) litRooms.delete(activeRoomId);
          else litRooms.add(activeRoomId);
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
            Loop door een deur naar de volgende kamer.
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
