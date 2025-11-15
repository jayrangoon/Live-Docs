"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";

type DrawingStroke = {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  userId: string;
  userName: string;
  timestamp: number;
};

type DrawingCanvasProps = {
  currentColor: string;
  currentWidth: number;
  tool: "pen" | "eraser";
  isEnabled: boolean;
  currentUserId: string;
  currentUserName: string;
  userType: "creator" | "editor" | "viewer";
};

const DrawingCanvas = ({
  currentColor,
  currentWidth,
  tool,
  isEnabled,
  currentUserId,
  currentUserName,
  userType,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<
    Array<{ x: number; y: number }>
  >([]);

  // Get drawings from Liveblocks storage
  const drawings = useStorage((root) => root.drawings);

  // Initialize storage if it doesn't exist
  const initializeStorage = useMutation(({ storage }) => {
    const drawings = storage.get("drawings");
    if (!drawings) {
      storage.set("drawings", new LiveList([]));
    }
  }, []);

  // Add a new stroke to storage
  const addStroke = useMutation(
    ({ storage }, stroke: DrawingStroke) => {
      const drawings = storage.get("drawings");
      if (drawings) {
        drawings.push(stroke);
      }
    },
    []
  );

  // Remove specific strokes (for eraser)
  const removeStroke = useMutation(
    ({ storage }, strokeId: string) => {
      const drawings = storage.get("drawings");
      if (drawings) {
        const index = drawings.findIndex((s) => s.id === strokeId);
        if (index !== -1) {
          drawings.delete(index);
        }
      }
    },
    []
  );

  // Initialize storage on mount
  useEffect(() => {
    initializeStorage();
  }, [initializeStorage]);

  // Redraw canvas whenever drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    if (drawings) {
      drawings.forEach((stroke) => {
        drawStroke(ctx, stroke.points, stroke.color, stroke.width);
      });
    }

    // Draw current stroke being drawn (only for pen)
    if (currentStroke.length > 0 && tool === "pen") {
      drawStroke(ctx, currentStroke, currentColor, currentWidth);
    }

    // Draw eraser indicator
    if (tool === "eraser" && currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, currentWidth * 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [drawings, currentStroke, currentColor, currentWidth, tool]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const drawStroke = (
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    color: string,
    width: number
  ) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  // Check if a point is near a stroke (for eraser)
  const isPointNearStroke = (
    point: { x: number; y: number },
    stroke: DrawingStroke,
    threshold: number
  ): boolean => {
    for (let i = 0; i < stroke.points.length; i++) {
      const strokePoint = stroke.points[i];
      const distance = Math.sqrt(
        Math.pow(point.x - strokePoint.x, 2) + Math.pow(point.y - strokePoint.y, 2)
      );
      if (distance < threshold + stroke.width) {
        return true;
      }
    }
    return false;
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEnabled || userType === "viewer") return;

    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    setCurrentStroke([coords]);

    // If eraser, start erasing immediately
    if (tool === "eraser" && drawings) {
      const eraserThreshold = currentWidth * 2;
      drawings.forEach((stroke) => {
        if (isPointNearStroke(coords, stroke, eraserThreshold)) {
          removeStroke(stroke.id);
        }
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isEnabled || userType === "viewer") return;

    const coords = getCanvasCoordinates(e);
    setCurrentStroke((prev) => [...prev, coords]);

    // If eraser tool is active, check for strokes to erase
    if (tool === "eraser" && drawings) {
      const eraserThreshold = currentWidth * 2;
      drawings.forEach((stroke) => {
        if (isPointNearStroke(coords, stroke, eraserThreshold)) {
          removeStroke(stroke.id);
        }
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || userType === "viewer") return;

    // Only save stroke if using pen tool
    if (tool === "pen" && currentStroke.length > 1) {
      const newStroke: DrawingStroke = {
        id: `${Date.now()}-${Math.random()}`,
        points: currentStroke,
        color: currentColor,
        width: currentWidth,
        userId: currentUserId,
        userName: currentUserName,
        timestamp: Date.now(),
      };

      addStroke(newStroke);
    }

    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`absolute inset-0 ${
        isEnabled && userType !== "viewer" ? "cursor-crosshair" : "pointer-events-none"
      }`}
      style={{
        touchAction: "none",
        zIndex: isEnabled ? 10 : 0,
      }}
    />
  );
};

export default DrawingCanvas;

