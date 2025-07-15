import './App.css';
import styled from 'styled-components/macro'
import { useContext, useState, useEffect } from 'react';
import { BASE_URL } from './App';
import { SocketContext } from './Context';

export default function TransformMenu({ saveLayerState, activeLayerName, layerOps, trackTransforms, saveTrackTransforms }) {
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [scaleZ, setScaleZ] = useState(1)
  const [reflectX, setReflectX] = useState(false)
  const [reflectY, setReflectY] = useState(false)
  const [reflectZ, setReflectZ] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)
  const [matrix, setMatrix] = useState(() => [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]);
  const [eachTransformMatrix, setEachTransformMatrix] = useState([ // For setting origin after a transform (undo affect?)
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]);
  // const [indvidualTransforms, setIndividualTransforms] = useState({})

  const [composedMatrices, setComposedMatrices] = useState({});

  const socket = useContext(SocketContext);
  const [originCoord, setOriginCoord] = useState(null);

  const describeTransform = (key, value) => {
    switch (key) {
      case "translateX": return `Translate in X by ${value}`;
      case "translateY": return `Translate in Y by ${value}`;
      case "translateZ": return `Translate in Z by ${value}`;
      case "rotateX": return `Rotate on X axis by ${value} degrees`;
      case "rotateY": return `Rotate on Y axis by ${value} degrees`;
      case "rotateZ": return `Rotate on Z axis by ${value} degrees`;
      case "scaleX": return `Scale in X by ${value}`;
      case "scaleY": return `Scale in Y by ${value}`;
      case "scaleZ": return `Scale in Z by ${value}`;
      case "reflectX": return `Reflect on X axis`;
      case "reflectY": return `Reflect on Y axis`;
      case "reflectZ": return `Reflect on Z axis`;
      default: return `Unknown transform ${key} with value ${value}`;
    }
  };

  useEffect(() => {
    if (!socket?.current) return;

    const handlePositionUpdate = (data) => {
      console.log("Received position:", data.position);
      setOriginCoord(data.position);
    };

    socket.current.on('position-updated', handlePositionUpdate);

    return () => {
      socket.current.off('position-updated', handlePositionUpdate);
    };
  }, [socket]);

  const handleMatrixChange = (key, value) => {
    const numValue =
      typeof value === "boolean" ? value :
        value === "-" ? value :
          value === "" ? "" : parseFloat(value)

    const stateUpdaters = {
      translateX: setTranslateX,
      translateY: setTranslateY,
      translateZ: setTranslateZ,
      rotateX: setRotateX,
      rotateY: setRotateY,
      rotateZ: setRotateZ,
      scaleX: setScaleX,
      scaleY: setScaleY,
      scaleZ: setScaleZ,
      reflectX: setReflectX,
      reflectY: setReflectY,
      reflectZ: setReflectZ
    };

    if (stateUpdaters[key]) {
      stateUpdaters[key](numValue);
      updateEachTransformMatrix(key, numValue);
    }
  };

  const updateEachTransformMatrix = (key, value) => {
    let matrix;

    switch (key) {
      case "translateX":
        matrix = [
          [1, 0, 0, value],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        break;

      case "translateY":
        matrix = [
          [1, 0, 0, 0],
          [0, 1, 0, value],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        break;

      case "translateZ":
        matrix = [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, value],
          [0, 0, 0, 1],
        ];
        break;

      case "rotateX": {
        const rad = (value * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        matrix = [
          [1, 0, 0, 0],
          [0, cos, -sin, 0],
          [0, sin, cos, 0],
          [0, 0, 0, 1],
        ];
        break;
      }

      case "rotateY": {
        const rad = (value * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        matrix = [
          [cos, 0, sin, 0],
          [0, 1, 0, 0],
          [-sin, 0, cos, 0],
          [0, 0, 0, 1],
        ];
        break;
      }

      case "rotateZ": {
        const rad = (value * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        matrix = [
          [cos, -sin, 0, 0],
          [sin, cos, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        break;
      }

      case "scaleX":
        matrix = [
          [value, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];

        break;

      case "scaleY":
        matrix = [
          [1, 0, 0, 0],
          [0, value, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        break;

      case "scaleZ":
        matrix = [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, value, 0],
          [0, 0, 0, 1],
        ];
        break;

      case "reflectX":
        matrix = [
          [value ? -1 : 1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        break;

      case "reflectY":
        matrix = [
          [1, 0, 0, 0],
          [0, value ? -1 : 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        break;

      case "reflectZ":
        matrix = [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, value ? -1 : 1, 0],
          [0, 0, 0, 1],
        ];
        break;

      default:
        matrix = [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
    }

    setEachTransformMatrix(matrix);
  };


  const multiplyMatrices = (A, B) => {
    if (!Array.isArray(A) || !Array.isArray(B) || !Array.isArray(B[0])) {
      console.error("Invalid matrices passed to multiplyMatrices:", A, B);
      return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; // fallback
    }
  
    return A.map((row, i) =>
      B[0].map((_, j) => row.reduce((sum, elm, k) => sum + elm * B[k][j], 0))
    );
  };  

  const multiplyVectorMatrix = (vec, mat) => {
    if (!Array.isArray(vec) || vec.length !== 4 || !Array.isArray(mat) || mat.length !== 4) {
      console.error("Invalid vector or matrix in multiplyVectorMatrix", vec, mat);
      return [0, 0, 0, 1]; // fallback
    }
  
    return mat[0].map((_, col) =>
      vec.reduce((sum, val, row) => sum + val * mat[row][col], 0)
    );
  };
  
  
  useEffect(() => {
    const [oxPretransform, oyPretransform, ozPretransform] = originCoord || [0, 0, 0];
    const vec = [oxPretransform, oyPretransform, ozPretransform, 1];
    console.log("Previous transform:", eachTransformMatrix) // Use inverse?? FUTURE
    const vecTransformed = multiplyVectorMatrix(vec, eachTransformMatrix);
    const [ox, oy, oz] = vecTransformed.slice(0, 3);
    const radX = (rotateX * Math.PI) / 180;
    const radY = (rotateY * Math.PI) / 180;
    const radZ = (rotateZ * Math.PI) / 180;

    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosY = Math.cos(radY), sinY = Math.sin(radY);
    const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

    const rotX = [
      [1, 0, 0, 0],
      [0, cosX, -sinX, oy * (1 - cosX) + oz * sinX],
      [0, sinX, cosX, oz * (1 - cosX) - oy * sinX],
      [0, 0, 0, 1]
    ];

    const rotY = [
      [cosY, 0, sinY, ox * (1 - cosY) - oz * sinY],
      [0, 1, 0, 0],
      [-sinY, 0, cosY, oz * (1 - cosY) + ox * sinY],
      [0, 0, 0, 1]
    ];

    const rotZ = [
      [cosZ, -sinZ, 0, ox * (1 - cosZ) + oy * sinZ],
      [sinZ, cosZ, 0, oy * (1 - cosZ) - ox * sinZ],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    const scaleMatrix = [
      [scaleX, 0, 0, ox * (1 - scaleX)],
      [0, scaleY, 0, oy * (1 - scaleY)],
      [0, 0, scaleZ, oz * (1 - scaleZ)],
      [0, 0, 0, 1]
    ];

    const translationMatrix = [
      [1, 0, 0, translateX],
      [0, 1, 0, translateY],
      [0, 0, 1, translateZ],
      [0, 0, 0, 1]
    ];

    const reflectMatrix = [
      [reflectX ? -1 : 1, 0, 0, reflectX ? 2 * ox : 0],
      [0, reflectY ? -1 : 1, 0, reflectY ? 2 * oy : 0],
      [0, 0, reflectZ ? -1 : 1, reflectZ ? 2 * oz : 0],
      [0, 0, 0, 1]
    ];

    // Multiply matrices in the correct order
    let finalMatrix = multiplyMatrices(
      translationMatrix,
      multiplyMatrices(rotZ,
        multiplyMatrices(rotY,
          multiplyMatrices(rotX,
            multiplyMatrices(scaleMatrix, reflectMatrix)
          )
        )
      )
    );

    setMatrix(finalMatrix);

    const sendMatrixToServer = async () => {
      if (activeLayerName) {
        let composedMatrix = finalMatrix;
        console.log("layerOps", layerOps)
        console.log("layerOps[activeLayerName", layerOps[activeLayerName])
        if (layerOps[activeLayerName] && layerOps[activeLayerName].length != 0) {
          let compositeMatrix = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
          ];

          for (const prevMatrix of layerOps[activeLayerName]) {
            compositeMatrix = multiplyMatrices(compositeMatrix, prevMatrix);
          }

          composedMatrix = multiplyMatrices(compositeMatrix, finalMatrix);
        }
        // Track composed matrices for undo, FUTURE don't put in useEffect because it updates often and saves many when sliding
        setComposedMatrices((prev) => ({
          ...prev,
          [activeLayerName]: [...(prev[activeLayerName] || []), composedMatrix]
        }));

        const data = [
          [
            [composedMatrix[0][0], composedMatrix[0][1], composedMatrix[0][2], composedMatrix[0][3]],
            [composedMatrix[1][0], composedMatrix[1][1], composedMatrix[1][2], composedMatrix[1][3]],
            [composedMatrix[2][0], composedMatrix[2][1], composedMatrix[2][2], composedMatrix[2][3]],
          ],
          activeLayerName
        ];
        console.log("Data before sending", data)

        try {
          await fetch(`${BASE_URL}/transform`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          console.log("Matrix sent to server:", data);
        } catch (error) {
          console.error("Error submitting transform:", error);
        }
      }

      else {
        console.log("No layer selected")
      }
    };

    sendMatrixToServer();
  }, [translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scaleX, scaleY, scaleZ, reflectX, reflectY, reflectZ]);

  const onReset = async () => {
    setTranslateX(0);
    setTranslateY(0);
    setTranslateZ(0);
    setRotateX(0);
    setRotateY(0);
    setRotateZ(0);
    setScaleX(1);
    setScaleY(1);
    setScaleZ(1);
    setReflectX(false);
    setReflectY(false);
    setReflectZ(false);

    const identityMatrix = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];

    setMatrix(identityMatrix);
    setEachTransformMatrix(identityMatrix);

    if (activeLayerName) {
      saveLayerState(activeLayerName, []);
      saveTrackTransforms(activeLayerName, []);

      const resetData = [
        [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0]
        ],
        activeLayerName
      ];

      try {
        await fetch(`${BASE_URL}/transform`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resetData)
        });
        await fetch(`${BASE_URL}/reset_origin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("Failed to reset matrix on server:", error);
      }
    } else {
      console.warn("Reset failed: no active layer selected.");
    }
  };


  const onResetInputs = () => {
    setTranslateX(0)
    setTranslateY(0)
    setTranslateZ(0)
    setRotateX(0)
    setRotateY(0)
    setRotateZ(0)
    setScaleX(1)
    setScaleY(1)
    setScaleZ(1)
    setReflectX(false)
    setReflectY(false)
    setReflectZ(false)

    setMatrix([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ])
  }

  const undoLastTransform = async () => {
    if (
      !activeLayerName ||
      !layerOps[activeLayerName]?.length ||
      !composedMatrices[activeLayerName]?.length
    ) {
      console.warn("No transform to undo for layer:", activeLayerName);
      return false;
    }
  
    // Pop the last matrix from layerOps
    const newLayerOps = [...layerOps[activeLayerName]];
    newLayerOps.pop();
  
    // Pop the last composed matrix
    const newComposedHistory = [...composedMatrices[activeLayerName]];
    newComposedHistory.pop();
    console.log("HISTORY", newComposedHistory)
  
    // Get the new current composed matrix
    const lastComposed = newComposedHistory.length > 0
      ? newComposedHistory[newComposedHistory.length - 1]
      : [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
    
    // Update state
    saveLayerState(activeLayerName, newLayerOps);
    setComposedMatrices((prev) => ({
      ...prev,
      [activeLayerName]: newComposedHistory,
    }));

    console.log("COMPOSED", composedMatrices[activeLayerName])
    saveTrackTransforms(activeLayerName, (prev) =>
      prev?.length ? prev.slice(0, -1) : []
    );
  
    // Send last composed matrix to server
    const transformData = [
      [
        [lastComposed[0][0], lastComposed[0][1], lastComposed[0][2], lastComposed[0][3]],
        [lastComposed[1][0], lastComposed[1][1], lastComposed[1][2], lastComposed[1][3]],
        [lastComposed[2][0], lastComposed[2][1], lastComposed[2][2], lastComposed[2][3]],
      ],
      activeLayerName,
    ];
  
    try {
      await fetch(`${BASE_URL}/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformData),
      });
      console.log("Undo successful. Sent:", transformData);
      return true;
    } catch (error) {
      console.error("Undo failed:", error);
      return false;
    }
  };  
  
  const handleSaveLayerState = async () => {
    if (activeLayerName) {
      saveLayerState(activeLayerName, matrix);
      // For snapping origin to transformed origin
      try {
        await fetch(`${BASE_URL}/set_origin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eachTransformMatrix), // 7/14: currently set_origin does not change origin
        });
      } catch (error) {
        console.error("Error updating origin:", error);
      }

      const transformValues = {
        translateX,
        translateY,
        translateZ,
        rotateX,
        rotateY,
        rotateZ,
        scaleX,
        scaleY,
        scaleZ,
        reflectX,
        reflectY,
        reflectZ,
      };

      for (const key in transformValues) {
        const value = transformValues[key];
        const defaultVal =
          key.startsWith("scale") ? 1 :
            key.startsWith("reflect") ? false : 0;


        if (
          (key.startsWith("reflect") && value === true) ||
          (!key.startsWith("reflect") && value !== defaultVal)
        ) {
          const description = describeTransform(key, value);
          console.log("Saving description:", description, "for", activeLayerName);
          saveTrackTransforms(activeLayerName, description);
        }
      }
      onResetInputs();
    } else {
      console.error("No layer selected.");
    }
  };

  const onExportMatrix = () => {
    const filename = "transform_matrix.json";
    const jsonStr = JSON.stringify({ matrix }, null, 2);
  
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  
    URL.revokeObjectURL(url);
  };

  // const onSetOrigin = async () => {
  //   const response = await fetch(`${BASE_URL}/set_origin_button`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ layerName: activeLayerName })
  //   });
  //   const data = await response.json();
  //   console.log("Local position response:", data);

  //   // const origin_transform = await fetch(`${BASE_URL}/set_origin_button`)
  //   // console.log(origin_transform)
  // }

  return (
    <TransformContainer>
      {originCoord && (
        <p>
          <span style={{ fontWeight: 'bold', fontSize: '1.2em'}}>Current Origin:</span> [{originCoord.map(v => v.toFixed(2)).join(', ')}]
        </p>
      )}
      <SettingContainer>
        <SubtitleTransform>Translate in X, Y, or Z-axis</SubtitleTransform>
        <SliderContainer>
          <Subtitle>X: </Subtitle>
          <Slider
            type="range"
            min="-100"
            max="100"
            step="1"
            value={translateX}
            onChange={(e) => handleMatrixChange("translateX", e.target.value)}
            onMouseUp={handleSaveLayerState}
          />
          <Input
            value={translateX}
            onChange={(e) => handleMatrixChange("translateX", e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>

        <SliderContainer>
          <Subtitle>Y: </Subtitle>
          <Slider
            type="range"
            min="-100"
            max="100"
            step="1"
            value={translateY}
            onChange={(e) => handleMatrixChange("translateY", e.target.value)}
            onMouseUp={handleSaveLayerState}
          />
          <Input
            value={translateY}
            onChange={(e) => handleMatrixChange("translateY", e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>

        <SliderContainer>
          <Subtitle>Z: </Subtitle>
          <Slider
            type="range"
            min="-100"
            max="100"
            step="1"
            value={translateZ}
            onChange={(e) => handleMatrixChange("translateZ", e.target.value)}
            onMouseUp={handleSaveLayerState}
          />
          <Input
            value={translateZ}
            onChange={(e) => handleMatrixChange("translateZ", e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>
      </SettingContainer>

      <SettingContainer>
        <SubtitleTransform>Scale in X, Y, or Z-axis</SubtitleTransform>
        <SliderContainer>
          <Subtitle>X: </Subtitle>
          <Slider
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            value={scaleX}
            onChange={(e) => { handleMatrixChange("scaleX", e.target.value) }}
            onMouseUp={handleSaveLayerState}
          />
          <Input
            value={scaleX}
            onChange={(e) => { handleMatrixChange("scaleX", e.target.value) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>

        <SliderContainer>
          <Subtitle>Y: </Subtitle>
          <Slider
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            value={scaleY}
            onChange={(e) => { handleMatrixChange("scaleY", e.target.value) }}
            onMouseUp={handleSaveLayerState}
          />
          <Input
            value={scaleY}
            onChange={(e) => { handleMatrixChange("scaleY", e.target.value) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>

        <SliderContainer>
          <Subtitle>Z: </Subtitle>
          <Slider
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            value={scaleZ}
            onChange={(e) => { handleMatrixChange("scaleZ", e.target.value) }}
            onMouseUp={handleSaveLayerState}
          />
          <Input
            value={scaleZ}
            onChange={(e) => { handleMatrixChange("scaleZ", e.target.value) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>
      </SettingContainer>

      <SettingContainer>
        <SubtitleTransform>Rotate about X, Y, or Z-axis in degrees</SubtitleTransform>
        <SliderContainer>
          <Subtitle>X: </Subtitle>
          <Slider
            type="range"
            min="-360"
            max="360"
            step="1"
            value={rotateX}
            onChange={(e) => { handleMatrixChange("rotateX", e.target.value) }}
            onMouseUp={handleSaveLayerState}
          />
          {/* <Input
                value={`${rotateX}°`}
                onChange={(e) => {
                  let newValue = e.target.value.replace("°", "");
                  handleMatrixChange("rotateX", e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    handleMatrixChange("rotateX", rotateX + 1);
                  } else if (e.key === "ArrowDown") {
                    handleMatrixChange("rotateX", rotateX - 1);
                  }
                }}
                type="text"
              /> */}
          <Input
            value={rotateX}
            onChange={(e) => { handleMatrixChange("rotateX", e.target.value) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>

        <SliderContainer>
          <Subtitle>Y: </Subtitle>
          <Slider
            type="range"
            min="-360"
            max="360"
            step="1"
            value={rotateY}
            onChange={(e) => { handleMatrixChange("rotateY", e.target.value) }}
            onMouseUp={handleSaveLayerState}
          />
          {/* <Input
              value={{rotateY}}
              onChange={(e) => {
                let newValue = e.target.value;
                handleMatrixChange("rotateX", newValue);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  handleMatrixChange("rotateX", rotateX + 1);
                } else if (e.key === "ArrowDown") {
                  handleMatrixChange("rotateX", rotateX - 1);
                }
              }}
              type="number"
            />           */}
          <Input
            value={rotateY}
            onChange={(e) => { handleMatrixChange("rotateY", e.target.value) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>

        <SliderContainer>
          <Subtitle>Z: </Subtitle>
          <Slider
            type="range"
            min="-360"
            max="360"
            step="1"
            value={rotateZ}
            onChange={(e) => { handleMatrixChange("rotateZ", e.target.value) }}
            onMouseUp={handleSaveLayerState}
          />
          {/* <Input value={`${rotateZ}°`} onChange={(e) => {let newValue = e.target.value.replace("°", ""); handleMatrixChange("rotateZ", newValue); }} inputProps={{type: 'number', pattern: "-?[0-9]*"}} ></Input> */}
          <Input
            value={rotateZ}
            onChange={(e) => { handleMatrixChange("rotateZ", e.target.value) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLayerState()}
            type="number"
          />
        </SliderContainer>
      </SettingContainer>

      <SettingContainer>
        <SubtitleTransform>Reflect on X, Y, or Z-axis</SubtitleTransform>
        <ReflectContainer>
          <ReflectAxisContainer>
            <Subtitle>X: </Subtitle>
            <input
              type="checkbox"
              checked={reflectX}
              onChange={(e) => { handleMatrixChange("reflectX", e.target.checked); setTimeout(handleSaveLayerState, 0); }}
              onMouseUp={handleSaveLayerState}
            />
          </ReflectAxisContainer>

          <ReflectAxisContainer>
            <Subtitle>Y: </Subtitle>
            <input
              type="checkbox"
              checked={reflectY}
              onMouseUp={handleSaveLayerState}
              onChange={(e) => handleMatrixChange("reflectY", e.target.checked)}
            />
          </ReflectAxisContainer>

          <ReflectAxisContainer>
            <Subtitle>Z: </Subtitle>
            <input
              type="checkbox"
              checked={reflectZ}
              onMouseUp={handleSaveLayerState}
              onChange={(e) => handleMatrixChange("reflectZ", e.target.checked)}
            />
          </ReflectAxisContainer>
        </ReflectContainer>
      </SettingContainer>

      <MatrixContainer>
        <Subtitle>Transformation Matrix</Subtitle>
        {Array.isArray(matrix) && Array.isArray(matrix[0]) && ( // In case matrix is null, prevent rendering error
          <GridContainer>
            {matrix.flat().map((value, index) => (
              <GridCell key={index}>
                {value % 1 === 0 ? value : value.toFixed(2)}
              </GridCell>
            ))}
          </GridContainer>
        )}
      </MatrixContainer>

      <ButtonContainer>
        <ResetButton onClick={onReset}>Reset</ResetButton>
        <ResetButton onClick={undoLastTransform}>Undo Last Transform</ResetButton>
        <ResetButton onClick={onExportMatrix}>Export Matrix</ResetButton>
      </ButtonContainer>
    </TransformContainer>
  )
}

const ButtonContainer = styled.div`
display: flex;
width: 100%;
justify-content: space-between;
`

const UndoButton = styled.button`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    transition: background-color 0.3s;

    &:hover {
        background-color: #0056b3;
    }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: fit-content;
`;

const TransformContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`
const SubtitleTransform = styled.h3`
margin-bottom: 0px;
font-size: 12px;
`

const Subtitle = styled.h3`
`

const SettingContainer = styled.div`
width: calc(100% - 3rem);
`

const SliderContainer = styled.div`
display: flex;
width: 100%;
align-items: center;
`

const Slider = styled.input`
  flex: 1;
  margin-left: 0.5em;
`
const Input = styled.input`
  height: 20px;
  width: 35px;
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  margin-left: 0.5em;
`

const ReflectAxisContainer = styled.div`
display: flex;
width: 33%;
justify-content: center;
`

const ReflectContainer = styled.div`
display: flex;
width: 100%;
align-items: center;
justify-content: stretch;
`

const MatrixContainer = styled.div`
display: flex;
width: calc(100% - 3rem);
justify-content: center;
align-items: center;
flex-direction: column;
`

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 60%;
`;

const GridCell = styled.div`
  border: 1px solid black;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
`;

const ResetButton = styled.button`
margin-top: 1rem;
padding: 0.5rem 1rem;
border: none;
border-radius: 0.5rem;
font-size: 0.9rem;
cursor: pointer;
&:hover {
    background-color:rgb(137, 137, 137);
}
`;
