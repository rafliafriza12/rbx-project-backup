import React, { memo } from "react";
import Hyperspeed from "@/components/Hyperspeed";

const HyperspeedBackground = memo(() => {
  return (
    <div className="w-screen h-screen hidden lg:block inset-0 absolute z-[-5] overflow-hidden blur-[3px]">
      <div className=" w-full h-[40vh] absolute bg-gradient-to-t from-[#22102A] to-transparent bottom-0"></div>
      <Hyperspeed
        effectOptions={{
          onSpeedUp: () => {},
          onSlowDown: () => {},
          distortion: "turbulentDistortion",
          length: 400,
          roadWidth: 10,
          islandWidth: 2,
          lanesPerRoad: 4,
          fov: 90,
          fovSpeedUp: 150,
          speedUp: 2,
          carLightsFade: 0.4,
          totalSideLightSticks: 20,
          lightPairsPerRoadWay: 40,
          shoulderLinesWidthPercentage: 0.05,
          brokenLinesWidthPercentage: 0.1,
          brokenLinesLengthPercentage: 0.5,
          lightStickWidth: [0.12, 0.5],
          lightStickHeight: [1.3, 1.7],
          movingAwaySpeed: [60, 80],
          movingCloserSpeed: [-120, -160],
          carLightsLength: [400 * 0.05, 400 * 0.15],
          carLightsRadius: [0.05, 0.14],
          carWidthPercentage: [0.3, 0.5],
          carShiftX: [-0.8, 0.8],
          carFloorSeparation: [0, 5],
          colors: {
            roadColor: 0x080808,
            islandColor: 0x0a0a0a,
            background: 0x000000,
            shoulderLines: 0x131318,
            brokenLines: 0x131318,
            leftCars: [0xd856aa, 0x6366f1],
            rightCars: [0x03a9f4, 0x4fc3f7],
            sticks: 0xd856aa,
          },
        }}
      />
    </div>
  );
});

HyperspeedBackground.displayName = "HyperspeedBackground";

export default HyperspeedBackground;
