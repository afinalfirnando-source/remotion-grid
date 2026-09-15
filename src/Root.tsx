import React from 'react';
import { Composition } from 'remotion';
import { GridDots } from './components/GridDots';
import { SphereRipple } from './components/SphereRipple';
import { DiamondKaleidoscope } from './components/DiamondKaleidoscope';
import { PlexusNetwork } from './components/PlexusNetwork';
import { VortexTunnel } from './components/VortexTunnel';
import { PastelFluidWaves } from './components/PastelFluidWaves';
import { HexagonalWave3D } from './components/HexagonalWave3D';
import { BreathingMesh } from './components/BreathingMesh';
import { HypnoSpiral } from './components/HypnoSpiral';
import TorusKnot from './components/TorusKnot';
import { PurpleCubes } from './components/PurpleCubes';
import { HexCubes } from './components/HexCubes';
import { RadialHex } from './components/RadialHex';
import RetroWaves from './components/RetroWaves';
import { palettes } from './utils/colors';

const FPS = 30;
const DURATION = FPS * 10;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GridWave"
        component={() => (
          <GridDots palette={palettes.ocean} rows={20} cols={35} speed={1} width={3840} height={2160} dotSize={12} totalFrames={DURATION} />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="GridWaveNeon"
        component={() => (
          <GridDots palette={palettes.neon} rows={20} cols={35} speed={1} width={3840} height={2160} dotSize={12} totalFrames={DURATION} />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SphereRipple"
        component={() => (
          <SphereRipple width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ocean" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="NeonPurpleSphere"
        component={() => (
          <SphereRipple width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neonPurple" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SunsetGoldSphere"
        component={() => (
          <SphereRipple width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="sunsetGold" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="DiamondKaleidoscope"
        component={() => (
          <DiamondKaleidoscope width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="PlexusNetwork"
        component={() => (
          <PlexusNetwork width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="VortexTunnel"
        component={() => (
          <VortexTunnel width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="cyan" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FireVortex"
        component={() => (
          <VortexTunnel width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neonPink" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraVortex"
        component={() => (
          <VortexTunnel width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="toxicGreen" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="PastelFluidWaves"
        component={() => (
          <PastelFluidWaves width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HexagonalWave3D"
        component={() => (
          <HexagonalWave3D width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="cyan" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MagmaHex"
        component={() => (
          <HexagonalWave3D width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="magma" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraHex"
        component={() => (
          <HexagonalWave3D width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="aurora" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="BreathingMeshBlue"
        component={() => (
          <BreathingMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="blueOcean" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="BreathingMeshSteel"
        component={() => (
          <BreathingMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="steel" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="BreathingMeshDeepSea"
        component={() => (
          <BreathingMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="deepSea" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HypnoSpiralClassic"
        component={() => (
          <HypnoSpiral width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="classic" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HypnoSpiralNeon"
        component={() => (
          <HypnoSpiral width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neon" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HypnoSpiralSunset"
        component={() => (
          <HypnoSpiral width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="sunset" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="TorusKnot"
        component={() => (
          <TorusKnot width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="PurpleCubes"
        component={() => (
          <PurpleCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="purple" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="NeonCubes"
        component={() => (
          <PurpleCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neon" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MagmaCubes"
        component={() => (
          <PurpleCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="magma" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="EmeraldHex"
        component={() => (
          <HexCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="emerald" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="OceanHex"
        component={() => (
          <HexCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ocean" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaHex"
        component={() => (
          <HexCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="lava" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RadialHex"
        component={() => (
          <RadialHex width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="blue" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RadialHexRed"
        component={() => (
          <RadialHex width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="red" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RadialHexGreen"
        component={() => (
          <RadialHex width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="green" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RetroWaves"
        component={() => (
          <RetroWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="classic" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RetroWavesCandy"
        component={() => (
          <RetroWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="candy" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RetroWavesMiami"
        component={() => (
          <RetroWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="miami" />
        )}
        durationInFrames={DURATION}
        fps={FPS}
        width={3840}
        height={2160}
      />
    </>
  );
};
