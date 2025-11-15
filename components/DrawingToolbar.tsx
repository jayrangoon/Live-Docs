"use client";

import React from "react";
import { useMutation } from "@liveblocks/react/suspense";
import Image from "next/image";

type DrawingToolbarProps = {
  currentColor: string;
  setCurrentColor: (color: string) => void;
  currentWidth: number;
  setCurrentWidth: (width: number) => void;
  tool: "pen" | "eraser";
  setTool: (tool: "pen" | "eraser") => void;
  onClose: () => void;
  userType: "creator" | "editor" | "viewer";
};

const COLORS = [
  "#000000", // Black
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#FFC0CB", // Pink
];

const WIDTHS = [2, 4, 6, 8, 12];

const DrawingToolbar = ({
  currentColor,
  setCurrentColor,
  currentWidth,
  setCurrentWidth,
  tool,
  setTool,
  onClose,
  userType,
}: DrawingToolbarProps) => {
  const clearAllDrawings = useMutation(({ storage }) => {
    const drawings = storage.get("drawings");
    if (drawings) {
      drawings.clear();
    }
  }, []);

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all drawings?")) {
      clearAllDrawings();
    }
  };

  const canDraw = userType !== "viewer";

  return (
    <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 border border-gray-200 flex flex-col gap-4 max-w-[250px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-gray-800 font-semibold text-sm">Drawing Tools</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {userType === "viewer" && (
        <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          View-only mode: You can see drawings but cannot draw
        </div>
      )}

      {/* Tools */}
      {canDraw && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-600 font-medium">Tool</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTool("pen")}
              className={`flex-1 p-2 rounded-md transition-all ${
                tool === "pen"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span className="text-xs">Pen</span>
              </div>
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`flex-1 p-2 rounded-md transition-all ${
                tool === "eraser"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs">Erase</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {canDraw && tool === "pen" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-600 font-medium">Color</label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  currentColor === color
                    ? "border-white scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stroke Width */}
      {canDraw && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-600 font-medium">
            {tool === "pen" ? "Stroke Width" : "Eraser Size"}
          </label>
          <div className="flex items-center gap-2">
            {WIDTHS.map((width) => (
              <button
                key={width}
                onClick={() => setCurrentWidth(width)}
                className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                  currentWidth === width
                    ? "bg-blue-500"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div
                  className="rounded-full bg-gray-800"
                  style={{
                    width: `${width}px`,
                    height: `${width}px`,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear All Button */}
      {canDraw && (
        <button
          onClick={handleClearAll}
          className="w-full p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-all text-sm font-medium border border-red-500/30"
        >
          Clear All Drawings
        </button>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        {canDraw
          ? "Click and drag to draw"
          : "Drawings are visible to all users"}
      </div>
    </div>
  );
};

export default DrawingToolbar;

