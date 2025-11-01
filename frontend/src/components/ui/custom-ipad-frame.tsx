"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CustomIPadFrameProps {
  children: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
}

export function CustomIPadFrame({
  children,
  className,
  width = 800,
  height = 600,
}: CustomIPadFrameProps) {
  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* iPad Outer Frame - Slimmer bezels */}
      <div className="absolute inset-0 bg-gray-200 rounded-[2.5rem] p-2">
        {/* iPad Screen Border - Minimal */}
        <div className="relative w-full h-full bg-gray-100 rounded-[2.2rem] p-1">
          {/* iPad Screen */}
          <div className="relative w-full h-full bg-white rounded-[2rem] overflow-hidden shadow-inner">
            {/* Top Camera - More realistic */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="w-2 h-2 bg-gray-800 rounded-full opacity-60"></div>
            </div>

            {/* Status Bar */}
            <div className="absolute top-3 left-0 right-0 z-10 px-6 py-2">
              <div className="flex justify-between items-center text-black text-sm font-medium">
                <div className="text-sm font-semibold">9:41 AM</div>
                <div className="flex items-center space-x-3">
                  {/* WiFi */}
                  <svg
                    className="w-4 h-4 fill-black"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12,3C7.79,3 4.04,4.78 1.23,7.65L2.65,9.07C5.13,6.74 8.46,5.5 12,5.5C15.54,5.5 18.87,6.74 21.35,9.07L22.77,7.65C19.96,4.78 16.21,3 12,3M7.77,10.89L9.19,12.31C10.17,11.86 11.54,11.5 12,11.5C12.46,11.5 13.83,11.86 14.81,12.31L16.23,10.89C14.68,10.03 13.39,9.5 12,9.5C10.61,9.5 9.32,10.03 7.77,10.89M12,13.5A1.5,1.5 0 0,1 13.5,15A1.5,1.5 0 0,1 12,16.5A1.5,1.5 0 0,1 10.5,15A1.5,1.5 0 0,1 12,13.5Z" />
                  </svg>
                  {/* Bluetooth */}
                  <svg
                    className="w-4 h-4 fill-black"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.71,7.71L12,2H11V9.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L11,14.41V22H12L17.71,16.29L13.41,12L17.71,7.71M13,5.83L15.17,8L13,10.17V5.83M13,13.83L15.17,16L13,18.17V13.83Z" />
                  </svg>
                  {/* Battery */}
                  <div className="flex items-center">
                    <span className="text-xs mr-2 font-medium">100%</span>
                    <div className="w-7 h-3 border border-black rounded-sm">
                      <div className="w-5 h-1.5 bg-green-500 rounded-sm mt-0.5 ml-0.5"></div>
                    </div>
                    <div className="w-0.5 h-1.5 bg-black rounded-r-sm ml-0.5"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="absolute inset-0 pt-14 pb-6">{children}</div>
          </div>
        </div>
      </div>

      {/* Side Elements - More subtle */}
      {/* Volume buttons */}
      <div className="absolute right-0 top-28 w-1.5 h-5 bg-gray-300 rounded-l-md"></div>
      <div className="absolute right-0 top-36 w-1.5 h-5 bg-gray-300 rounded-l-md"></div>

      {/* Power button */}
      <div className="absolute top-0 right-28 w-5 h-1.5 bg-gray-300 rounded-b-md"></div>
    </div>
  );
}
