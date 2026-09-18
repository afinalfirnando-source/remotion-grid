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
import { TriMesh } from './components/TriMesh';
import { FiberOptic } from './components/FiberOptic';
import { WaveSpectrum } from './components/WaveSpectrum';
import { SilkWaves } from './components/SilkWaves';
import type { SilkWavesScheme } from './components/SilkWaves';
import { Inferno } from './components/Inferno';
import type { InfernoScheme } from './components/Inferno';
import { AuroraFlow } from './components/AuroraFlow';
import type { AuroraFlowScheme } from './components/AuroraFlow';
import { GlitterFlow } from './components/GlitterFlow';
import { LiquidChrome } from './components/LiquidChrome';
import type { LiquidChromeScheme } from './components/LiquidChrome';
import { LavaVeins } from './components/LavaVeins';
import type { LavaVeinsScheme } from './components/LavaVeins';
import { MarbleFlow } from './components/MarbleFlow';
import type { MarbleScheme } from './components/MarbleFlow';
import { UnderwaterCaustics } from './components/UnderwaterCaustics';
import type { CausticScheme } from './components/UnderwaterCaustics';
import { FrostCrystal } from './components/FrostCrystal';
import type { FrostScheme } from './components/FrostCrystal';
import { palettes } from './utils/colors';

const FPS = 30;
const DURATION = FPS * 15;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GridWave"
        component={() => (
          <GridDots palette={palettes.ocean} rows={20} cols={35} speed={1} width={3840} height={2160} dotSize={12} totalFrames={DURATION} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="GridWaveNeon"
        component={() => (
          <GridDots palette={palettes.neon} rows={20} cols={35} speed={1} width={3840} height={2160} dotSize={12} totalFrames={DURATION} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SphereRipple"
        component={() => (
          <SphereRipple width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ocean" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="NeonPurpleSphere"
        component={() => (
          <SphereRipple width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neonPurple" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SunsetGoldSphere"
        component={() => (
          <SphereRipple width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="sunsetGold" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="DiamondKaleidoscope"
        component={() => (
          <DiamondKaleidoscope width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="PlexusNetwork"
        component={() => (
          <PlexusNetwork width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="VortexTunnel"
        component={() => (
          <VortexTunnel width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="cyan" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FireVortex"
        component={() => (
          <VortexTunnel width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neonPink" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraVortex"
        component={() => (
          <VortexTunnel width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="toxicGreen" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="PastelFluidWaves"
        component={() => (
          <PastelFluidWaves width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HexagonalWave3D"
        component={() => (
          <HexagonalWave3D width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="cyan" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MagmaHex"
        component={() => (
          <HexagonalWave3D width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="magma" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraHex"
        component={() => (
          <HexagonalWave3D width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="aurora" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="BreathingMeshBlue"
        component={() => (
          <BreathingMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="blueOcean" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="BreathingMeshSteel"
        component={() => (
          <BreathingMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="steel" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="BreathingMeshDeepSea"
        component={() => (
          <BreathingMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="deepSea" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HypnoSpiralClassic"
        component={() => (
          <HypnoSpiral width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="classic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HypnoSpiralNeon"
        component={() => (
          <HypnoSpiral width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neon" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="HypnoSpiralSunset"
        component={() => (
          <HypnoSpiral width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="sunset" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="TorusKnot"
        component={() => (
          <TorusKnot width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="PurpleCubes"
        component={() => (
          <PurpleCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="purple" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="NeonCubes"
        component={() => (
          <PurpleCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neon" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MagmaCubes"
        component={() => (
          <PurpleCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="magma" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="EmeraldHex"
        component={() => (
          <HexCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="emerald" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="OceanHex"
        component={() => (
          <HexCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ocean" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaHex"
        component={() => (
          <HexCubes width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="lava" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RadialHex"
        component={() => (
          <RadialHex width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="blue" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RadialHexRed"
        component={() => (
          <RadialHex width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="red" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RadialHexGreen"
        component={() => (
          <RadialHex width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="green" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RetroWaves"
        component={() => (
          <RetroWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="classic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RetroWavesCandy"
        component={() => (
          <RetroWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="candy" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="RetroWavesMiami"
        component={() => (
          <RetroWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="miami" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="TriMeshOcean"
        component={() => (
          <TriMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ocean" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="TriMeshSunset"
        component={() => (
          <TriMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="sunset" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="TriMeshNeon"
        component={() => (
          <TriMesh width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neon" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FiberOptic"
        component={() => (
          <FiberOptic width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="WaveSpectrum"
        component={() => (
          <WaveSpectrum width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SilkWavesRainbow"
        component={() => (
          <SilkWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="rainbow" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SilkWavesAurora"
        component={() => (
          <SilkWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="aurora" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SilkWavesFire"
        component={() => (
          <SilkWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="fire" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="SilkWavesOcean"
        component={() => (
          <SilkWaves width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ocean" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="Inferno"
        component={() => (
          <Inferno width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="inferno" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="InfernoBlueFire"
        component={() => (
          <Inferno width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="bluefire" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="InfernoToxic"
        component={() => (
          <Inferno width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="toxic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="InfernoVoid"
        component={() => (
          <Inferno width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="void" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="InfernoSolar"
        component={() => (
          <Inferno width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="solar" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraFlow"
        component={() => (
          <AuroraFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="neon" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraFlowSunset"
        component={() => (
          <AuroraFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="sunset" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraFlowArctic"
        component={() => (
          <AuroraFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="arctic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraFlowForest"
        component={() => (
          <AuroraFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="forest" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="AuroraFlowGolden"
        component={() => (
          <AuroraFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="golden" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="GlitterFlow"
        component={() => (
          <GlitterFlow width={3840} height={2160} totalFrames={DURATION} speed={1} />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LiquidChrome"
        component={() => (
          <LiquidChrome width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="chrome" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LiquidChromeGold"
        component={() => (
          <LiquidChrome width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="gold" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LiquidChromeRose"
        component={() => (
          <LiquidChrome width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="rose" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LiquidChromeEmerald"
        component={() => (
          <LiquidChrome width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="emerald" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LiquidChromeObsidian"
        component={() => (
          <LiquidChrome width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="obsidian" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaVeins"
        component={() => (
          <LavaVeins width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="lava" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaVeinsIce"
        component={() => (
          <LavaVeins width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ice" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaVeinsToxic"
        component={() => (
          <LavaVeins width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="toxic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaVeinsVoid"
        component={() => (
          <LavaVeins width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="void" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="LavaVeinsSolar"
        component={() => (
          <LavaVeins width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="solar" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MarbleFlow"
        component={() => (
          <MarbleFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="classic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MarbleFlowNoir"
        component={() => (
          <MarbleFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="noir" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MarbleFlowRosa"
        component={() => (
          <MarbleFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="rosa" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MarbleFlowVerde"
        component={() => (
          <MarbleFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="verde" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="MarbleFlowRoyal"
        component={() => (
          <MarbleFlow width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="royal" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="UnderwaterCaustics"
        component={() => (
          <UnderwaterCaustics width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="tropical" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="UnderwaterCausticsDeepOcean"
        component={() => (
          <UnderwaterCaustics width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="deepOcean" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="UnderwaterCausticsCoral"
        component={() => (
          <UnderwaterCaustics width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="coral" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="UnderwaterCausticsKelp"
        component={() => (
          <UnderwaterCaustics width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="kelp" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="UnderwaterCausticsAbyss"
        component={() => (
          <UnderwaterCaustics width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="abyss" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FrostCrystal"
        component={() => (
          <FrostCrystal width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="arctic" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FrostCrystalAurora"
        component={() => (
          <FrostCrystal width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="aurora" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FrostCrystalEmber"
        component={() => (
          <FrostCrystal width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="ember" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FrostCrystalVoid"
        component={() => (
          <FrostCrystal width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="void" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
      <Composition
        id="FrostCrystalEmerald"
        component={() => (
          <FrostCrystal width={3840} height={2160} totalFrames={DURATION} speed={1} scheme="emerald" />
        )}
        durationInFrames={DURATION + 1}
        fps={FPS}
        width={3840}
        height={2160}
      />
    </>
  );
};
