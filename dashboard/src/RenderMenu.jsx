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

function ImageRenderMenu({ layerName }) {
  const [opacity, setOpacity] = useState(1);
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(65535);
  const [mode, setMode] = useState("rgb");
  const [numChannels, setNumChannels] = useState(3); // set this dynamically if needed
  const [gammaValues, setGammaValues] = useState(Array(3).fill(1)); // default 3 channels

  const handleSliderChange = (key, value) => {
    const numValue = parseFloat(value);
    if (key === 'opacity') setOpacity(numValue);
    if (key === 'rangeMin') setRangeMin(numValue);
    if (key === 'rangeMax') setRangeMax(numValue);
  };

  const handleGammaChange = (index, value) => {
    const updated = [...gammaValues];
    updated[index] = parseFloat(value);
    setGammaValues(updated);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  useEffect(() => {
    if (!layerName) return;

    const shader = mode === "rgb"
      ? `\
${gammaValues.map((_, i) => `#uicontrol float gamma${i} slider(min=0.1, max=5, step=0.01, default=${gammaValues[i].toFixed(2)})`).join('\n')}
#uicontrol invlerp normalized(range=[${rangeMin}, ${rangeMax}])
void main() {
  float v = normalized();
  vec3 rgb = vec3(0.0);
${gammaValues.map((_, i) => `  rgb += pow(vec3(v), vec3(gamma${i})) / ${gammaValues.length.toFixed(1)};`).join('\n')}
  emitRGB(rgb);
}`
      : `#uicontrol invlerp normalized(range=[${rangeMin}, ${rangeMax}])
void main() {
  emitGrayscale(normalized());
}`;

    const payload = {
      layerName,
      opacity,
      shader,
      shaderControls: {
        normalized: { range: [rangeMin, rangeMax] }
      }
    };

    const send = async () => {
      try {
        const res = await fetch(`${BASE_URL}/update_image_rendering`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Server error");
        console.log("Image rendering updated:", payload);
      } catch (err) {
        console.error("Failed to update rendering:", err);
      }
    };

    send();
  }, [opacity, rangeMin, rangeMax, mode, gammaValues]);

  return (
    <SettingContainer>
      <SectionHeaderRow>
        <SectionTitle>Image Rendering Controls for <strong>{layerName}</strong></SectionTitle>
        <ModeToggle>
          <ModeButton selected={mode === "rgb"} onClick={() => handleModeChange("rgb")}>RGB</ModeButton>
          <ModeButton selected={mode === "greyscale"} onClick={() => handleModeChange("greyscale")}>Greyscale</ModeButton>
        </ModeToggle>
      </SectionHeaderRow>

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

      <SubtitleTransform>Normalized Shader Range</SubtitleTransform>
      <SliderContainer>
        <Subtitle>Min:</Subtitle>
        <Slider
          type="range"
          min="0"
          max={rangeMax}
          step="1"
          value={rangeMin}
          onChange={(e) => handleSliderChange("rangeMin", e.target.value)}
        />
        <Input
          type="number"
          value={rangeMin}
          onChange={(e) => handleSliderChange("rangeMin", e.target.value)}
        />
      </SliderContainer>

      <SliderContainer>
        <Subtitle>Max:</Subtitle>
        <Slider
          type="range"
          min={rangeMin}
          max="65535"
          step="1"
          value={rangeMax}
          onChange={(e) => handleSliderChange("rangeMax", e.target.value)}
        />
        <Input
          type="number"
          value={rangeMax}
          onChange={(e) => handleSliderChange("rangeMax", e.target.value)}
        />
      </SliderContainer>

      {mode === "rgb" && (
        <>
          <SubtitleTransform>Gamma (Per Channel)</SubtitleTransform>
          {gammaValues.map((gamma, idx) => (
            <SliderContainer key={idx}>
              <Subtitle>Gamma {idx + 1}</Subtitle>
              <Slider
                type="range"
                min="0.1"
                max="5"
                step="0.01"
                value={gamma}
                onChange={(e) => handleGammaChange(idx, e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                value={gamma}
                onChange={(e) => handleGammaChange(idx, e.target.value)}
              />
            </SliderContainer>
          ))}
        </>
      )}
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
