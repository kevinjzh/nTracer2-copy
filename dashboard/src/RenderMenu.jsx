import styled from 'styled-components/macro';
import { useEffect, useState } from 'react';
import { BASE_URL } from './App';

export default function RenderMenu({ activeLayerName, layerType }) {
  if (!activeLayerName || !layerType) {
    return <Message>No layer selected. Please select a layer to view rendering options.</Message>;
  }

  switch (layerType) {
    case "image":
      return <ImageRenderMenu layerName={activeLayerName} />;
    case "segmentation":
      return <SegmentRenderMenu layerName={activeLayerName} />;
    case "mesh":
      return <MeshRenderMenu layerName={activeLayerName} />;
    default:
      return <Message>Unsupported layer type: {layerType}</Message>;
  }
}

// ────────────────────────────────────────────────────────────────
// IMAGE LAYER RENDER MENU
// ────────────────────────────────────────────────────────────────

// function ImageRenderMenu({ layerName }) {
//   const [opacity, setOpacity] = useState(1);
//   const [mode, setMode] = useState("rgb");

//   const [numChannels, setNumChannels] = useState(0);

//   // RGB per-channel states
//   const [channelEnabled, setChannelEnabled] = useState([]);
//   const [channelColors, setChannelColors] = useState([]);
//   const [normalizeRanges, setNormalizeRanges] = useState([]);
//   const [brightnessValues, setBrightnessValues] = useState([]);
//   const [contrastValues, setContrastValues] = useState([]);
//   const [gammaValues, setGammaValues] = useState([]);

//   // Greyscale-specific state
//   const [greyNormalize, setGreyNormalize] = useState({ min: 0, max: 65535 });
//   const [greyBrightness, setGreyBrightness] = useState(0.0);
//   const [greyContrast, setGreyContrast] = useState(1.0);
//   const [greyGamma, setGreyGamma] = useState(1.0);

//   const handleModeChange = (newMode) => setMode(newMode);

//   const handleChannelToggle = (idx) => {
//     const updated = [...channelEnabled];
//     updated[idx] = !updated[idx];
//     setChannelEnabled(updated);
//   };

//   const handleColorChange = (idx, color) => {
//     const updated = [...channelColors];
//     updated[idx] = color;
//     setChannelColors(updated);
//   };

//   const handleNormalizeChange = (idx, key, value) => {
//     const updated = [...normalizeRanges];
//     updated[idx] = {
//       ...updated[idx],
//       [key]: parseFloat(value),
//     };
//     setNormalizeRanges(updated);
//   };

//   const handleBrightnessChange = (idx, value) => {
//     const updated = [...brightnessValues];
//     updated[idx] = parseFloat(value);
//     setBrightnessValues(updated);
//   };

//   const handleContrastChange = (idx, value) => {
//     const updated = [...contrastValues];
//     updated[idx] = parseFloat(value);
//     setContrastValues(updated);
//   };

//   const handleGammaChange = (idx, value) => {
//     const updated = [...gammaValues];
//     updated[idx] = parseFloat(value);
//     setGammaValues(updated);
//   };

//   // Generate distinct HSL colors for ANY number of channels
//   const defaultColorForIndex = (i) => {
//     const hue = (i * 137.5) % 360; // evenly distributed hues
//     return `hsl(${hue}, 80%, 50%)`;
//   };

//   // Fetch num_channels dynamically whenever layerName changes
//   useEffect(() => {
//     if (!layerName) return;

//     const fetchLayerChannels = async () => {
//       try {
//         const res = await fetch(`${BASE_URL}/layers`);
//         const layers = await res.json();
//         const selectedLayer = layers.find((l) => l.name === layerName);

//         let newNumChannels = 1; // fallback
//         if (selectedLayer?.num_channels) {
//           newNumChannels = selectedLayer.num_channels;
//         }

//         console.log(`Layer ${layerName} has ${newNumChannels} channels`);
//         setNumChannels(newNumChannels);

//         // FULL RESET of per-channel arrays
//         setChannelEnabled(Array(newNumChannels).fill(true));
//         setChannelColors(
//           Array.from({ length: newNumChannels }, (_, i) => defaultColorForIndex(i))
//         );
//         setNormalizeRanges(
//           Array.from({ length: newNumChannels }, () => ({ min: 0, max: 65535 }))
//         );
//         setBrightnessValues(Array(newNumChannels).fill(0.0));
//         setContrastValues(Array(newNumChannels).fill(1.0));
//         setGammaValues(Array(newNumChannels).fill(1.0));

//         // Reset greyscale state too
//         setGreyNormalize({ min: 0, max: 65535 });
//         setGreyBrightness(0.0);
//         setGreyContrast(1.0);
//         setGreyGamma(1.0);
//       } catch (err) {
//         console.error("Failed to fetch layer channels:", err);

//         // fallback to 1 channel
//         setNumChannels(1);
//         setChannelEnabled([true]);
//         setChannelColors([defaultColorForIndex(0)]);
//         setNormalizeRanges([{ min: 0, max: 65535 }]);
//         setBrightnessValues([0.0]);
//         setContrastValues([1.0]);
//         setGammaValues([1.0]);
//       }
//     };

//     fetchLayerChannels();
//   }, [layerName]);

//   // === Build shader dynamically ===
//   useEffect(() => {
//     if (!layerName) return;

//     const shaderLines = [];

//     if (mode === "rgb" && numChannels > 0) {
//       // === RGB Shader ===
//       for (let i = 0; i < numChannels; i++) {
//         const nr = normalizeRanges[i] ?? { min: 0, max: 65535 };
//         const min = nr.min ?? 0;
//         const max = nr.max ?? 65535;

//         const color = channelColors[i] ?? defaultColorForIndex(i);
//         const enabled = channelEnabled[i] ?? true;
//         const brightness = brightnessValues[i] ?? 0.0;
//         const contrast = contrastValues[i] ?? 1.0;
//         const gamma = gammaValues[i] ?? 1.0;

//         shaderLines.push(`// === Channel ${i + 1} ===`);
//         shaderLines.push(`#uicontrol bool enable_ch${i} checkbox(default=${enabled})`);
//         shaderLines.push(`#uicontrol vec3 color_ch${i} color(default="${color}")`);
//         shaderLines.push(`#uicontrol invlerp norm_ch${i}(range=[${min}, ${max}])`);
//         shaderLines.push(
//           `#uicontrol float brightness_ch${i} slider(min=-0.5, max=0.5, step=0.01, default=${brightness.toFixed(2)})`
//         );
//         shaderLines.push(
//           `#uicontrol float contrast_ch${i} slider(min=0.1, max=10, step=0.01, default=${contrast.toFixed(2)})`
//         );
//         shaderLines.push(
//           `#uicontrol float gamma_ch${i} slider(min=0.1, max=3, step=0.01, default=${gamma.toFixed(2)})`
//         );
//         shaderLines.push("");
//       }

//       shaderLines.push("// === Global Controls ===");
//       shaderLines.push("#uicontrol float global_gamma slider(min=0.1, max=3, step=0.01, default=1)");
//       shaderLines.push("#uicontrol float global_brightness slider(min=-0.5, max=0.5, step=0.01)");
//       shaderLines.push("#uicontrol float global_opacity slider(min=0, max=1, step=0.01, default=1)");
//       shaderLines.push("");
//       shaderLines.push("void main() {");
//       shaderLines.push("  vec3 finalColor = vec3(0.0);");
//       shaderLines.push("  float totalAlpha = 0.0;");
//       for (let i = 0; i < numChannels; i++) {
//         shaderLines.push(`  if (enable_ch${i}) {`);
//         shaderLines.push(`    float val_ch${i} = norm_ch${i}(getDataValue(${i}));`);
//         shaderLines.push(`    val_ch${i} = val_ch${i} + brightness_ch${i};`);
//         shaderLines.push(`    val_ch${i} = val_ch${i} * contrast_ch${i};`);
//         shaderLines.push(`    val_ch${i} = pow(clamp(val_ch${i}, 0.0, 1.0), gamma_ch${i});`);
//         shaderLines.push(`    finalColor += val_ch${i} * color_ch${i};`);
//         shaderLines.push(`    totalAlpha += val_ch${i};`);
//         shaderLines.push("  }");
//       }
//       shaderLines.push("  finalColor = finalColor + global_brightness;");
//       shaderLines.push("  finalColor = pow(clamp(finalColor, 0.0, 1.0), vec3(global_gamma));");
//       shaderLines.push("  totalAlpha = clamp(totalAlpha * global_opacity, 0.0, 1.0);");
//       shaderLines.push("  emitRGBA(vec4(finalColor, totalAlpha));");
//       shaderLines.push("}");

//     } else if (mode === "greyscale") {
//       // === Greyscale Shader ===
//       const min = greyNormalize.min ?? 0;
//       const max = greyNormalize.max ?? 65535;

//       shaderLines.push(`#uicontrol invlerp norm(range=[${min}, ${max}])`);
//       shaderLines.push(
//         `#uicontrol float brightness slider(min=-0.5, max=0.5, step=0.01, default=${greyBrightness.toFixed(2)})`
//       );
//       shaderLines.push(
//         `#uicontrol float contrast slider(min=0.1, max=10, step=0.01, default=${greyContrast.toFixed(2)})`
//       );
//       shaderLines.push(
//         `#uicontrol float gamma slider(min=0.1, max=3, step=0.01, default=${greyGamma.toFixed(2)})`
//       );
//       shaderLines.push("#uicontrol float global_opacity slider(min=0, max=1, step=0.01, default=1)");
//       shaderLines.push("");
//       shaderLines.push("void main() {");
//       shaderLines.push("  float v = norm(getDataValue(0));");
//       shaderLines.push("  v = v + brightness;");
//       shaderLines.push("  v = v * contrast;");
//       shaderLines.push("  v = pow(clamp(v, 0.0, 1.0), gamma);");
//       shaderLines.push("  emitGrayscale(v * global_opacity);");
//       shaderLines.push("}");
//     }

//     const shader = shaderLines.join("\n");

//     const payload = { layerName, opacity, shader };

//     const send = async () => {
//       try {
//         const res = await fetch(`${BASE_URL}/update_image_rendering`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });
//         if (!res.ok) throw new Error("Server error");
//         console.log("Image rendering updated:", payload);
//       } catch (err) {
//         console.error("Failed to update rendering:", err);
//       }
//     };

//     send();
//   }, [
//     mode,
//     opacity,
//     numChannels,
//     channelEnabled,
//     channelColors,
//     normalizeRanges,
//     brightnessValues,
//     contrastValues,
//     gammaValues,
//     greyNormalize,
//     greyBrightness,
//     greyContrast,
//     greyGamma,
//   ]);

//   return (
//     <SettingContainer>
//       <SectionHeaderRow>
//         <SectionTitle>
//           Image Rendering for <strong>{layerName}</strong>
//         </SectionTitle>
//         <ModeToggle>
//           <ModeButton selected={mode === "rgb"} onClick={() => handleModeChange("rgb")}>
//             RGB
//           </ModeButton>
//           <ModeButton selected={mode === "greyscale"} onClick={() => handleModeChange("greyscale")}>
//             Greyscale
//           </ModeButton>
//         </ModeToggle>
//       </SectionHeaderRow>

//       {/* Global Opacity */}
//       <SubtitleTransform>Global Opacity</SubtitleTransform>
//       <SliderContainer>
//         <Slider type="range" min="0" max="1" step="0.01" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
//         <Input type="number" step="0.01" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
//       </SliderContainer>

//       {/* === Greyscale UI === */}
//       {mode === "greyscale" && (
//         <>
//           <SubtitleTransform>Normalization Range</SubtitleTransform>
//           <SliderContainer>
//             <Subtitle>Min:</Subtitle>
//             <Slider
//               type="range"
//               min="0"
//               max={greyNormalize.max}
//               step="1"
//               value={greyNormalize.min}
//               onChange={(e) => setGreyNormalize((prev) => ({ ...prev, min: parseFloat(e.target.value) }))}
//             />
//             <Input
//               type="number"
//               value={greyNormalize.min}
//               onChange={(e) => setGreyNormalize((prev) => ({ ...prev, min: parseFloat(e.target.value) }))}
//             />
//           </SliderContainer>

//           <SliderContainer>
//             <Subtitle>Max:</Subtitle>
//             <Slider
//               type="range"
//               min={greyNormalize.min}
//               max="65535"
//               step="1"
//               value={greyNormalize.max}
//               onChange={(e) => setGreyNormalize((prev) => ({ ...prev, max: parseFloat(e.target.value) }))}
//             />
//             <Input
//               type="number"
//               value={greyNormalize.max}
//               onChange={(e) => setGreyNormalize((prev) => ({ ...prev, max: parseFloat(e.target.value) }))}
//             />
//           </SliderContainer>

//           <SubtitleTransform>Brightness</SubtitleTransform>
//           <SliderContainer>
//             <Slider type="range" min="-0.5" max="0.5" step="0.01" value={greyBrightness} onChange={(e) => setGreyBrightness(parseFloat(e.target.value))} />
//             <Input type="number" step="0.01" value={greyBrightness} onChange={(e) => setGreyBrightness(parseFloat(e.target.value))} />
//           </SliderContainer>

//           <SubtitleTransform>Contrast</SubtitleTransform>
//           <SliderContainer>
//             <Slider type="range" min="0.1" max="10" step="0.01" value={greyContrast} onChange={(e) => setGreyContrast(parseFloat(e.target.value))} />
//             <Input type="number" step="0.01" value={greyContrast} onChange={(e) => setGreyContrast(parseFloat(e.target.value))} />
//           </SliderContainer>

//           <SubtitleTransform>Gamma</SubtitleTransform>
//           <SliderContainer>
//             <Slider type="range" min="0.1" max="3" step="0.01" value={greyGamma} onChange={(e) => setGreyGamma(parseFloat(e.target.value))} />
//             <Input type="number" step="0.01" value={greyGamma} onChange={(e) => setGreyGamma(parseFloat(e.target.value))} />
//           </SliderContainer>
//         </>
//       )}

//       {/* === RGB UI === */}
//       {mode === "rgb" &&
//         numChannels > 0 &&
//         normalizeRanges.length === numChannels &&
//         channelColors.length === numChannels &&
//         Array.from({ length: numChannels }, (_, idx) => {
//           const nr = normalizeRanges[idx] ?? { min: 0, max: 65535 };

//           return (
//             <div key={idx} style={{ margin: "10px 0", padding: "10px" }}>
//               <SubtitleTransform>Channel {idx + 1}</SubtitleTransform>

//               <label>
//                 <input type="checkbox" checked={channelEnabled[idx]} onChange={() => handleChannelToggle(idx)} /> Enable
//               </label>

//               <div>
//                 <Subtitle>Color:</Subtitle>
//                 <ColorPicker value={channelColors[idx]} onChange={(e) => handleColorChange(idx, e.target.value)} />
//               </div>

//               <SubtitleTransform>Normalization Range</SubtitleTransform>
//               <SliderContainer>
//                 <Subtitle>Min:</Subtitle>
//                 <Slider
//                   type="range"
//                   min="0"
//                   max={nr.max}
//                   step="1"
//                   value={nr.min}
//                   onChange={(e) => handleNormalizeChange(idx, "min", e.target.value)}
//                 />
//                 <Input
//                   type="number"
//                   value={nr.min}
//                   onChange={(e) => handleNormalizeChange(idx, "min", e.target.value)}
//                 />
//               </SliderContainer>

//               <SliderContainer>
//                 <Subtitle>Max:</Subtitle>
//                 <Slider
//                   type="range"
//                   min={nr.min}
//                   max="65535"
//                   step="1"
//                   value={nr.max}
//                   onChange={(e) => handleNormalizeChange(idx, "max", e.target.value)}
//                 />
//                 <Input
//                   type="number"
//                   value={nr.max}
//                   onChange={(e) => handleNormalizeChange(idx, "max", e.target.value)}
//                 />
//               </SliderContainer>

//               <SubtitleTransform>Brightness</SubtitleTransform>
//               <SliderContainer>
//                 <Slider
//                   type="range"
//                   min="-0.5"
//                   max="0.5"
//                   step="0.01"
//                   value={brightnessValues[idx]}
//                   onChange={(e) => handleBrightnessChange(idx, e.target.value)}
//                 />
//                 <Input
//                   type="number"
//                   step="0.01"
//                   value={brightnessValues[idx]}
//                   onChange={(e) => handleBrightnessChange(idx, e.target.value)}
//                 />
//               </SliderContainer>

//               <SubtitleTransform>Contrast</SubtitleTransform>
//               <SliderContainer>
//                 <Slider
//                   type="range"
//                   min="0.1"
//                   max="10"
//                   step="0.01"
//                   value={contrastValues[idx]}
//                   onChange={(e) => handleContrastChange(idx, e.target.value)}
//                 />
//                 <Input
//                   type="number"
//                   step="0.01"
//                   value={contrastValues[idx]}
//                   onChange={(e) => handleContrastChange(idx, e.target.value)}
//                 />
//               </SliderContainer>

//               <SubtitleTransform>Gamma</SubtitleTransform>
//               <SliderContainer>
//                 <Slider
//                   type="range"
//                   min="0.1"
//                   max="3"
//                   step="0.01"
//                   value={gammaValues[idx]}
//                   onChange={(e) => handleGammaChange(idx, e.target.value)}
//                 />
//                 <Input
//                   type="number"
//                   step="0.01"
//                   value={gammaValues[idx]}
//                   onChange={(e) => handleGammaChange(idx, e.target.value)}
//                 />
//               </SliderContainer>
//             </div>
//           );
//         })}
//     </SettingContainer>
//   );
// }

function ImageRenderMenu({ layerName }) {
  const [opacity, setOpacity] = useState(1);
  const [mode, setMode] = useState("rgb");
  const [numChannels, setNumChannels] = useState(0);
  const [channelEnabled, setChannelEnabled] = useState([]);
  const [channelColors, setChannelColors] = useState([]);
  const [normalizeRanges, setNormalizeRanges] = useState([]);
  const [brightnessValues, setBrightnessValues] = useState([]);
  const [contrastValues, setContrastValues] = useState([]);
  const [gammaValues, setGammaValues] = useState([]);
  const [collapsedChannels, setCollapsedChannels] = useState([]);

  const toggleCollapse = (idx) => {
    const updated = [...collapsedChannels];
    updated[idx] = !updated[idx];
    setCollapsedChannels(updated);
  };

  const [greyNormalize, setGreyNormalize] = useState({ min: 0, max: 65535 });
  const [greyBrightness, setGreyBrightness] = useState(0.0);
  const [greyContrast, setGreyContrast] = useState(1.0);
  const [greyGamma, setGreyGamma] = useState(1.0);

  const handleModeChange = (newMode) => setMode(newMode);
  const handleChannelToggle = (idx) => {
    const updated = [...channelEnabled];
    updated[idx] = !updated[idx];
    setChannelEnabled(updated);
  };
  const handleColorChange = (idx, color) => {
    const updated = [...channelColors];
    updated[idx] = color;
    setChannelColors(updated);
  };
  const handleNormalizeChange = (idx, key, value) => {
    const updated = [...normalizeRanges];
    updated[idx] = {
      ...updated[idx],
      [key]: parseFloat(value),
    };
    setNormalizeRanges(updated);
  };
  const handleBrightnessChange = (idx, value) => {
    const updated = [...brightnessValues];
    updated[idx] = parseFloat(value);
    setBrightnessValues(updated);
  };
  const handleContrastChange = (idx, value) => {
    const updated = [...contrastValues];
    updated[idx] = parseFloat(value);
    setContrastValues(updated);
  };
  const handleGammaChange = (idx, value) => {
    const updated = [...gammaValues];
    updated[idx] = parseFloat(value);
    setGammaValues(updated);
  };

  const defaultColorForIndex = (i) => {
    const hue = (i * 137.5) % 360;
    return `hsl(${hue}, 80%, 50%)`;
  };

  useEffect(() => {
    if (!layerName) return;
    const fetchLayerChannels = async () => {
      try {
        const res = await fetch(`${BASE_URL}/layers`);
        const layers = await res.json();
        const selectedLayer = layers.find((l) => l.name === layerName);
        let newNumChannels = selectedLayer?.num_channels ?? 1;

        setNumChannels(newNumChannels);
        setChannelEnabled(Array(newNumChannels).fill(true));
        setChannelColors(Array.from({ length: newNumChannels }, (_, i) => defaultColorForIndex(i)));
        setNormalizeRanges(Array.from({ length: newNumChannels }, () => ({ min: 0, max: 65535 })));
        setBrightnessValues(Array(newNumChannels).fill(0.0));
        setContrastValues(Array(newNumChannels).fill(1.0));
        setGammaValues(Array(newNumChannels).fill(1.0));
        setCollapsedChannels(Array(newNumChannels).fill(false));
        setGreyNormalize({ min: 0, max: 65535 });
        setGreyBrightness(0.0);
        setGreyContrast(1.0);
        setGreyGamma(1.0);
      } catch (err) {
        console.error("Failed to fetch layer channels:", err);
      }
    };
    fetchLayerChannels();
  }, [layerName]);

  useEffect(() => {
    if (!layerName) return;

    const shaderLines = [];

    if (mode === "rgb" && numChannels > 0) {
      // === RGB Shader ===
      for (let i = 0; i < numChannels; i++) {
        const nr = normalizeRanges[i] ?? { min: 0, max: 65535 };
        const min = nr.min ?? 0;
        const max = nr.max ?? 65535;

        const color = channelColors[i] ?? defaultColorForIndex(i);
        const enabled = channelEnabled[i] ?? true;
        const brightness = brightnessValues[i] ?? 0.0;
        const contrast = contrastValues[i] ?? 1.0;
        const gamma = gammaValues[i] ?? 1.0;

        shaderLines.push(`// === Channel ${i + 1} ===`);
        shaderLines.push(`#uicontrol bool enable_ch${i} checkbox(default=${enabled})`);
        shaderLines.push(`#uicontrol vec3 color_ch${i} color(default="${color}")`);
        shaderLines.push(`#uicontrol invlerp norm_ch${i}(range=[${min}, ${max}])`);
        shaderLines.push(
          `#uicontrol float brightness_ch${i} slider(min=-0.5, max=0.5, step=0.01, default=${brightness.toFixed(2)})`
        );
        shaderLines.push(
          `#uicontrol float contrast_ch${i} slider(min=0.1, max=10, step=0.01, default=${contrast.toFixed(2)})`
        );
        shaderLines.push(
          `#uicontrol float gamma_ch${i} slider(min=0.1, max=3, step=0.01, default=${gamma.toFixed(2)})`
        );
        shaderLines.push("");
      }

      shaderLines.push("// === Global Controls ===");
      shaderLines.push("#uicontrol float global_gamma slider(min=0.1, max=3, step=0.01, default=1)");
      shaderLines.push("#uicontrol float global_brightness slider(min=-0.5, max=0.5, step=0.01)");
      shaderLines.push("#uicontrol float global_opacity slider(min=0, max=1, step=0.01, default=1)");
      shaderLines.push("");
      shaderLines.push("void main() {");
      shaderLines.push("  vec3 finalColor = vec3(0.0);");
      shaderLines.push("  float totalAlpha = 0.0;");
      for (let i = 0; i < numChannels; i++) {
        shaderLines.push(`  if (enable_ch${i}) {`);
        shaderLines.push(`    float val_ch${i} = norm_ch${i}(getDataValue(${i}));`);
        shaderLines.push(`    val_ch${i} = val_ch${i} + brightness_ch${i};`);
        shaderLines.push(`    val_ch${i} = val_ch${i} * contrast_ch${i};`);
        shaderLines.push(`    val_ch${i} = pow(clamp(val_ch${i}, 0.0, 1.0), gamma_ch${i});`);
        shaderLines.push(`    finalColor += val_ch${i} * color_ch${i};`);
        shaderLines.push(`    totalAlpha += val_ch${i};`);
        shaderLines.push("  }");
      }
      shaderLines.push("  finalColor = finalColor + global_brightness;");
      shaderLines.push("  finalColor = pow(clamp(finalColor, 0.0, 1.0), vec3(global_gamma));");
      shaderLines.push("  totalAlpha = clamp(totalAlpha * global_opacity, 0.0, 1.0);");
      shaderLines.push("  emitRGBA(vec4(finalColor, totalAlpha));");
      shaderLines.push("}");

    } else if (mode === "greyscale") {
      // === Greyscale Shader ===
      const min = greyNormalize.min ?? 0;
      const max = greyNormalize.max ?? 65535;

      shaderLines.push(`#uicontrol invlerp norm(range=[${min}, ${max}])`);
      shaderLines.push(
        `#uicontrol float brightness slider(min=-0.5, max=0.5, step=0.01, default=${greyBrightness.toFixed(2)})`
      );
      shaderLines.push(
        `#uicontrol float contrast slider(min=0.1, max=10, step=0.01, default=${greyContrast.toFixed(2)})`
      );
      shaderLines.push(
        `#uicontrol float gamma slider(min=0.1, max=3, step=0.01, default=${greyGamma.toFixed(2)})`
      );
      shaderLines.push("#uicontrol float global_opacity slider(min=0, max=1, step=0.01, default=1)");
      shaderLines.push("");
      shaderLines.push("void main() {");
      shaderLines.push("  float v = norm(getDataValue(0));");
      shaderLines.push("  v = v + brightness;");
      shaderLines.push("  v = v * contrast;");
      shaderLines.push("  v = pow(clamp(v, 0.0, 1.0), gamma);");
      shaderLines.push("  emitGrayscale(v * global_opacity);");
      shaderLines.push("}");
    }

    const shader = shaderLines.join("\n");

    const payload = { layerName, opacity, shader };

    const send = async () => {
      try {
        const res = await fetch(`${BASE_URL}/update_image_rendering`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Server error");
        console.log("Image rendering updated:", payload);
      } catch (err) {
        console.error("Failed to update rendering:", err);
      }
    };

    send();
  }, [
    mode,
    opacity,
    numChannels,
    channelEnabled,
    channelColors,
    normalizeRanges,
    brightnessValues,
    contrastValues,
    gammaValues,
    greyNormalize,
    greyBrightness,
    greyContrast,
    greyGamma,
  ]);

  return (
    <SettingContainer>
      <SectionHeaderRow>
        <SectionTitle>
          Image Rendering for <strong>{layerName}</strong>
        </SectionTitle>
        <ModeToggle>
          <ModeButton selected={mode === "rgb"} onClick={() => handleModeChange("rgb")}>RGB</ModeButton>
          <ModeButton selected={mode === "greyscale"} onClick={() => handleModeChange("greyscale")}>Greyscale</ModeButton>
        </ModeToggle>
      </SectionHeaderRow>

      {/* Global Opacity */}
      <SubtitleTransform>Global Opacity</SubtitleTransform>
      <SliderContainer>
        <Slider type="range" min="0" max="1" step="0.01" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
        <Input type="number" step="0.01" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
      </SliderContainer>

      {/* === Greyscale UI === */}
      {mode === "greyscale" && (
        <>
          <SubtitleTransform>Normalization Range</SubtitleTransform>
          <SliderContainer>
            <Subtitle>Min:</Subtitle>
            <Slider
              type="range"
              min="0"
              max={greyNormalize.max}
              step="1"
              value={greyNormalize.min}
              onChange={(e) => setGreyNormalize((prev) => ({ ...prev, min: parseFloat(e.target.value) }))}
            />
            <Input
              type="number"
              value={greyNormalize.min}
              onChange={(e) => setGreyNormalize((prev) => ({ ...prev, min: parseFloat(e.target.value) }))}
            />
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Max:</Subtitle>
            <Slider
              type="range"
              min={greyNormalize.min}
              max="65535"
              step="1"
              value={greyNormalize.max}
              onChange={(e) => setGreyNormalize((prev) => ({ ...prev, max: parseFloat(e.target.value) }))}
            />
            <Input
              type="number"
              value={greyNormalize.max}
              onChange={(e) => setGreyNormalize((prev) => ({ ...prev, max: parseFloat(e.target.value) }))}
            />
          </SliderContainer>

          <SubtitleTransform>Brightness</SubtitleTransform>
          <SliderContainer>
            <Slider type="range" min="-0.5" max="0.5" step="0.01" value={greyBrightness} onChange={(e) => setGreyBrightness(parseFloat(e.target.value))} />
            <Input type="number" step="0.01" value={greyBrightness} onChange={(e) => setGreyBrightness(parseFloat(e.target.value))} />
          </SliderContainer>

          <SubtitleTransform>Contrast</SubtitleTransform>
          <SliderContainer>
            <Slider type="range" min="0.1" max="10" step="0.01" value={greyContrast} onChange={(e) => setGreyContrast(parseFloat(e.target.value))} />
            <Input type="number" step="0.01" value={greyContrast} onChange={(e) => setGreyContrast(parseFloat(e.target.value))} />
          </SliderContainer>

          <SubtitleTransform>Gamma</SubtitleTransform>
          <SliderContainer>
            <Slider type="range" min="0.1" max="3" step="0.01" value={greyGamma} onChange={(e) => setGreyGamma(parseFloat(e.target.value))} />
            <Input type="number" step="0.01" value={greyGamma} onChange={(e) => setGreyGamma(parseFloat(e.target.value))} />
          </SliderContainer>
        </>
      )}

      {mode === "rgb" &&
        Array.from({ length: numChannels }, (_, idx) => (
          <ChannelBox key={idx}>
            <ChannelHeader onClick={() => toggleCollapse(idx)}>
              <strong style={{ fontSize: '12px' }} >Channel {idx + 1}</strong> {collapsedChannels[idx] ? '▼' : '▲'}
            </ChannelHeader>
            {!collapsedChannels[idx] && (
              <div>
                <label>
                  <input type="checkbox" checked={channelEnabled[idx]} onChange={() => handleChannelToggle(idx)} /> Enable
                </label>
                <div>
                  <Subtitle>Color:</Subtitle>
                  <ColorPicker value={channelColors[idx]} onChange={(e) => handleColorChange(idx, e.target.value)} />
                </div>
                <SubtitleTransform>Normalization Range</SubtitleTransform>
                <SliderContainer>
                  <Subtitle>Min:</Subtitle>
                  <Slider
                    type="range"
                    min="0"
                    max={normalizeRanges[idx]?.max || 65535}
                    step="1"
                    value={normalizeRanges[idx]?.min || 0}
                    onChange={(e) => handleNormalizeChange(idx, "min", e.target.value)}
                  />
                  <Input
                    type="number"
                    value={normalizeRanges[idx]?.min || 0}
                    onChange={(e) => handleNormalizeChange(idx, "min", e.target.value)}
                  />
                </SliderContainer>
                <SliderContainer>
                  <Subtitle>Max:</Subtitle>
                  <Slider
                    type="range"
                    min={normalizeRanges[idx]?.min || 0}
                    max="65535"
                    step="1"
                    value={normalizeRanges[idx]?.max || 65535}
                    onChange={(e) => handleNormalizeChange(idx, "max", e.target.value)}
                  />
                  <Input
                    type="number"
                    value={normalizeRanges[idx]?.max || 65535}
                    onChange={(e) => handleNormalizeChange(idx, "max", e.target.value)}
                  />
                </SliderContainer>
                <SubtitleTransform>Gamma</SubtitleTransform>
                <SliderContainer>
                  <Slider
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.01"
                    value={gammaValues[idx]}
                    onChange={(e) => handleGammaChange(idx, e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={gammaValues[idx]}
                    onChange={(e) => handleGammaChange(idx, e.target.value)}
                  />
                </SliderContainer>
              </div>
            )}
          </ChannelBox>
        ))}
    </SettingContainer>
  );
}


// ────────────────────────────────────────────────────────────────
// OTHER LAYER TYPES (STUBS)
// ────────────────────────────────────────────────────────────────

function SegmentRenderMenu({ layerName }) {
  const [opacity, setOpacity] = useState(1);
  const [saturation, setSaturation] = useState(1);

  const handleSliderChange = (key, value) => {
    const numValue = parseFloat(value);
    if (key === 'opacity') setOpacity(numValue);
    if (key === 'saturation') setSaturation(numValue);
  };

  useEffect(() => {
    setOpacity(1);
    setSaturation(1);
  }, [layerName]);

  useEffect(() => {
    const send = async () => {
      try {
        const res = await fetch(`${BASE_URL}/update_segment_rendering`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layerName,
            opacity,
            saturation
          })
        });
        if (!res.ok) throw new Error("Server error");
        console.log("Segment rendering updated:", { layerName, opacity, saturation });
      } catch (err) {
        console.error("Failed to update segment rendering:", err);
      }
    };

    send();
  }, [opacity, saturation]);

  return (
    <SettingContainer>
      <SectionTitle>Segment Rendering Controls for <strong>{layerName}</strong></SectionTitle>

      <SubtitleTransform>Opacity</SubtitleTransform>
      <SliderContainer>
        <Slider
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => handleSliderChange("opacity", e.target.value)}
        />
        <Input
          type="number"
          step="0.01"
          value={opacity}
          onChange={(e) => handleSliderChange("opacity", e.target.value)}
        />
      </SliderContainer>

      <SubtitleTransform>Saturation</SubtitleTransform>
      <SliderContainer>
        <Slider
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={saturation}
          onChange={(e) => handleSliderChange("saturation", e.target.value)}
        />
        <Input
          type="number"
          step="0.01"
          value={saturation}
          onChange={(e) => handleSliderChange("saturation", e.target.value)}
        />
      </SliderContainer>
    </SettingContainer>
  );
}


function MeshRenderMenu({ layerName }) {
  return <Section>Mesh Rendering Controls for <strong>{layerName}</strong></Section>;
}

// ────────────────────────────────────────────────────────────────
// STYLED COMPONENTS
// ────────────────────────────────────────────────────────────────

const ChannelBox = styled.div`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  background-color: #f9f9f9;
`;

const ChannelHeader = styled.div`
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 0.5em;
  user-select: none;
`;

const ColorPicker = styled.input.attrs({ type: "color" })`
  margin-left: 8px;
  cursor: pointer;
`;

const Message = styled.p`
  font-style: italic;
  font-size: 0.9rem;
`;

const Section = styled.div`
  padding: 1rem;
  font-size: 0.9rem;
`;

const SettingContainer = styled.div`
  width: calc(100% - 3rem);
  margin-top: 1rem;
`;

const SectionHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h4`
  font-size: 0.95rem;
`;

const SubtitleTransform = styled.h3`
  margin-top: 1rem;
  margin-bottom: 0px;
  font-size: 12px;
`;

const Subtitle = styled.h3`
  font-size: 12px;
  width: 40px;
`;

const SliderContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

const Slider = styled.input`
  flex: 1;
  margin-left: 0.5em;
`;

const Input = styled.input`
  height: 20px;
  width: 50px;
  text-align: center;
  font-size: 1em;
  margin-left: 0.5em;
`;

const ModeToggle = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ModeButton = styled.button`
  padding: 0.4rem 1rem;
  border-radius: 0.4rem;
  border: 1px solid #ccc;
  background-color: ${({ selected }) => selected ? '#007bff' : '#f0f0f0'};
  color: ${({ selected }) => selected ? 'white' : '#333'};
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
`;

// v1

// import styled from 'styled-components/macro';
// import { useEffect, useState } from 'react';
// import { BASE_URL } from './App';

// export default function RenderMenu({ activeLayerName, layerType }) {
//   if (!activeLayerName || !layerType) {
//     return <Message>No layer selected. Please select a layer to view rendering options.</Message>;
//   }

//   switch (layerType) {
//     case "image":
//       return <ImageRenderMenu layerName={activeLayerName} />;
//     case "segment":
//       return <SegmentRenderMenu layerName={activeLayerName} />;
//     case "mesh":
//       return <MeshRenderMenu layerName={activeLayerName} />;
//     default:
//       return <Message>Unsupported layer type: {layerType}</Message>;
//   }
// }

// // ─── IMAGE RENDER MENU ───────────────────────────────────────────

// function ImageRenderMenu({ layerName }) {
//   const [opacity, setOpacity] = useState(1);
//   const [rangeMin, setRangeMin] = useState(0);
//   const [rangeMax, setRangeMax] = useState(65535);
//   const [mode, setMode] = useState("rgb"); // "rgb" or "greyscale"

//   const handleSliderChange = (key, value) => {
//     const numValue = parseFloat(value);
//     if (key === 'opacity') setOpacity(numValue);
//     if (key === 'rangeMin') setRangeMin(numValue);
//     if (key === 'rangeMax') setRangeMax(numValue);
//   };

//   const handleModeChange = (newMode) => {
//     setMode(newMode);
//   };

//   useEffect(() => {
//     if (!layerName) return;

//     const shader = mode === "rgb"
//       ? `#uicontrol invlerp normalized(range=[${rangeMin}, ${rangeMax}])
// void main() {
//   float v = normalized();
//   emitRGB(vec3(0, v, 0));
// }`
//       : `#uicontrol invlerp normalized
// void main() {
//   emitGrayscale(normalized());
// }`;

//     const payload = {
//       layerName,
//       opacity,
//       shader,
//       shaderControls: mode === "rgb" ? { normalized: { range: [rangeMin, rangeMax] } } : {},
//     };

//     const send = async () => {
//       try {
//         const res = await fetch(`${BASE_URL}/update_image_rendering`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         });
//         if (!res.ok) throw new Error("Server error");
//         console.log("Image rendering updated:", payload);
//       } catch (err) {
//         console.error("Failed to update rendering:", err);
//       }
//     };

//     send();
//   }, [opacity, rangeMin, rangeMax, mode]);

//   return (
//     <SettingContainer>
//       <SectionTitle>Image Rendering Controls for <strong>{layerName}</strong></SectionTitle>

//       <SubtitleTransform>Opacity</SubtitleTransform>
//       <SliderContainer>
//         <Slider
//           type="range"
//           min="0"
//           max="1"
//           step="0.01"
//           value={opacity}
//           onChange={(e) => handleSliderChange("opacity", e.target.value)}
//         />
//         <Input
//           type="number"
//           step="0.01"
//           value={opacity}
//           onChange={(e) => handleSliderChange("opacity", e.target.value)}
//         />
//       </SliderContainer>

//       {mode === "rgb" && (
//         <>
//           <SubtitleTransform>Normalized Shader Range</SubtitleTransform>
//           <SliderContainer>
//             <Subtitle>Min:</Subtitle>
//             <Slider
//               type="range"
//               min="0"
//               max={rangeMax}
//               step="1"
//               value={rangeMin}
//               onChange={(e) => handleSliderChange("rangeMin", e.target.value)}
//             />
//             <Input
//               type="number"
//               value={rangeMin}
//               onChange={(e) => handleSliderChange("rangeMin", e.target.value)}
//             />
//           </SliderContainer>

//           <SliderContainer>
//             <Subtitle>Max:</Subtitle>
//             <Slider
//               type="range"
//               min={rangeMin}
//               max="65535"
//               step="1"
//               value={rangeMax}
//               onChange={(e) => handleSliderChange("rangeMax", e.target.value)}
//             />
//             <Input
//               type="number"
//               value={rangeMax}
//               onChange={(e) => handleSliderChange("rangeMax", e.target.value)}
//             />
//           </SliderContainer>
//         </>
//       )}

//       <SubtitleTransform>Shader Mode</SubtitleTransform>
//       <ModeToggle>
//         <ModeButton selected={mode === "rgb"} onClick={() => handleModeChange("rgb")}>
//           RGB
//         </ModeButton>
//         <ModeButton selected={mode === "greyscale"} onClick={() => handleModeChange("greyscale")}>
//           Greyscale
//         </ModeButton>
//       </ModeToggle>
//     </SettingContainer>
//   );
// }

// // ─── OTHER LAYER TYPES ───────────────────────────────────────────

// function SegmentRenderMenu({ layerName }) {
//   return <Section>Segment Rendering Controls for <strong>{layerName}</strong></Section>;
// }

// function MeshRenderMenu({ layerName }) {
//   return <Section>Mesh Rendering Controls for <strong>{layerName}</strong></Section>;
// }

// // ─── STYLED COMPONENTS ───────────────────────────────────────────

// const Message = styled.p`
//   font-style: italic;
//   font-size: 0.9rem;
// `;

// const Section = styled.div`
//   padding: 1rem;
//   font-size: 0.9rem;
// `;

// const SettingContainer = styled.div`
//   width: calc(100% - 3rem);
//   margin-top: 1rem;
// `;

// const SectionTitle = styled.h4`
//   font-size: 0.95rem;
//   margin-bottom: 1rem;
// `;

// const SubtitleTransform = styled.h3`
//   margin-bottom: 0px;
//   font-size: 12px;
// `;

// const Subtitle = styled.h3`
//   font-size: 12px;
//   width: 40px;
// `;

// const SliderContainer = styled.div`
//   display: flex;
//   width: 100%;
//   align-items: center;
// `;

// const Slider = styled.input`
//   flex: 1;
//   margin-left: 0.5em;
// `;

// const Input = styled.input`
//   height: 20px;
//   width: 50px;
//   text-align: center;
//   font-size: 1em;
//   margin-left: 0.5em;
// `;

// const ModeToggle = styled.div`
//   display: flex;
//   justify-content: space-between;
//   width: 100%;
//   margin-top: 0.5rem;
// `;

// const ModeButton = styled.button`
//   padding: 0.4rem 1rem;
//   border-radius: 0.4rem;
//   border: 1px solid #ccc;
//   background-color: ${({ selected }) => selected ? '#007bff' : '#f0f0f0'};
//   color: ${({ selected }) => selected ? 'white' : '#333'};
//   font-weight: bold;
//   cursor: pointer;
//   transition: 0.2s;
// `;
