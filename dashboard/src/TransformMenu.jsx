import './App.css';
import styled from 'styled-components/macro'
import { DashboardContext } from './DashboardReducer';
import { useContext, useState, useEffect } from 'react'
import { BASE_URL } from './App'

export default function TransformMenu() {
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)
  const [scale, setScale] = useState(1)
  const [reflectX, setReflectX] = useState(0)
  const [reflectY, setReflectY] = useState(0)
  const [reflectZ, setReflectZ] = useState(0)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)
  const [matrix, setMatrix] = useState([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0]
  ]);

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
      scale: setScale,
      reflectX: setReflectX,
      reflectY: setReflectY,
      reflectZ: setReflectZ
    };
  
    if (stateUpdaters[key]) {
      stateUpdaters[key](numValue);
    }
  };
  
  const multiplyMatrices = (A, B) => {
    return A.map((row, i) =>
      B[0].map((_, j) => row.reduce((sum, elm, k) => sum + elm * B[k][j], 0))
    );
  };
  

  useEffect(() => {
    const radX = (rotateX * Math.PI) / 180;
    const radY = (rotateY * Math.PI) / 180;
    const radZ = (rotateZ * Math.PI) / 180;

    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosY = Math.cos(radY), sinY = Math.sin(radY);
    const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

    const rotX = [
      [1, 0, 0, 0],
      [0, cosX, -sinX, 0],
      [0, sinX, cosX, 0],
      [0, 0, 0, 1]
    ];

    const rotY = [
      [cosY, 0, sinY, 0],
      [0, 1, 0, 0],
      [-sinY, 0, cosY, 0],
      [0, 0, 0, 1]
    ];

    const rotZ = [
      [cosZ, -sinZ, 0, 0],
      [sinZ, cosZ, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    const scaleMatrix = [
      [scale, 0, 0, 0],
      [0, scale, 0, 0],
      [0, 0, scale, 0],
      [0, 0, 0, 1]
    ];

    const translationMatrix = [
      [1, 0, 0, translateX],
      [0, 1, 0, translateY],
      [0, 0, 1, translateZ],
      [0, 0, 0, 1]
    ];

    const reflectMatrix = [
      [reflectX ? -1 : 1, 0, 0, 0],
      [0, reflectY ? -1 : 1, 0, 0],
      [0, 0, reflectZ ? -1 : 1, 0],
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
      const data = [
          [finalMatrix[0][0], finalMatrix[0][1], finalMatrix[0][2], finalMatrix[0][3]],
          [finalMatrix[1][0], finalMatrix[1][1], finalMatrix[1][2], finalMatrix[1][3]],
          [finalMatrix[2][0], finalMatrix[2][1], finalMatrix[2][2], finalMatrix[2][3]]
      ];

      try {
          await fetch(`${BASE_URL}/apply_translation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data)
          });
          console.log("Matrix sent to server:", data);
      } catch (error) {
          console.error("Error submitting transform:", error);
      }
    };

    sendMatrixToServer();
    
  }, [translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scale, reflectX, reflectY, reflectZ]);

  const onReset = () => {
    setTranslateX(0)
    setTranslateY(0)
    setTranslateZ(0)
    setRotateX(0)
    setRotateY(0)
    setRotateZ(0)
    setScale(1)
    setReflectX(false)
    setReflectY(false)
    setReflectZ(false)

    setMatrix([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0]
    ])
  }

  return (
      <TransformContainer>
        <SettingContainer>
          <SubtitleTransform>Translate in X, Y, or Z-axis</SubtitleTransform>
          <SliderContainer>
            <Subtitle>X: </Subtitle>
            {/* <Slider type="range" min="-100" max ="100" step="1" value={translateX} onChange={(e) => {handleMatrixChange("translateX", e.target.value)}} style={{
    background: `linear-gradient(
      to right, 
      white ${(translateX + 100) / 2}%, 
      blue ${(translateX + 100) / 2}%, 
      blue 100%
    )`
  }}/> */}
            <Slider type="range" min="-100" max ="100" step="1" value={translateX} onChange={(e) => {handleMatrixChange("translateX", e.target.value)}}/>
            <Input value={translateX} onChange={(e) => {handleMatrixChange("translateX", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number"></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Y: </Subtitle>
            <Slider type="range" min="-100" max ="100" step="1" value={translateY} onChange={(e) => {handleMatrixChange("translateY", e.target.value)}}/>
            <Input value={translateY} onChange={(e) => {handleMatrixChange("translateY", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number"></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Z: </Subtitle>
            <Slider type="range" min="-100" max ="100" step="1" value={translateZ} onChange={(e) => {handleMatrixChange("translateZ", e.target.value)}}/>
            <Input value={translateZ} onChange={(e) => {handleMatrixChange("translateZ", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number"></Input>
          </SliderContainer>
        </SettingContainer>

        <SettingContainer>
          <SubtitleTransform>Scale isotropically</SubtitleTransform>
          <SliderContainer>
            <Subtitle>C: </Subtitle>
            <Slider type="range" min="0.1" max ="2" step="0.01" value={scale} onChange={(e) => {handleMatrixChange("scale", e.target.value)}}/>
            <Input value={scale} onChange={(e) => {handleMatrixChange("scale", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number" step="0.01"></Input>
          </SliderContainer>
        </SettingContainer>

        <SettingContainer>
          <SubtitleTransform>Reflect on X, Y, or Z-axis</SubtitleTransform>
          <ReflectContainer>
            <ReflectAxisContainer>
              <Subtitle>X: </Subtitle>
              <input type="checkbox" checked={reflectX} onChange={(e) => handleMatrixChange("reflectX", e.target.checked)}/>
            </ReflectAxisContainer>

            <ReflectAxisContainer>
              <Subtitle>Y: </Subtitle>
              <input type="checkbox" checked={reflectY} onChange={(e) => handleMatrixChange("reflectY", e.target.checked)}/>
            </ReflectAxisContainer>

            <ReflectAxisContainer>
              <Subtitle>Z: </Subtitle>
              <input type="checkbox" checked={reflectZ} onChange={(e) => handleMatrixChange("reflectZ", e.target.checked)}/>
            </ReflectAxisContainer>
          </ReflectContainer>
        </SettingContainer>

        <SettingContainer>
          <SubtitleTransform>Rotate about X, Y, or Z-axis in degrees</SubtitleTransform>
          <SliderContainer>
            <Subtitle>X: </Subtitle>
            <Slider type="range" min="-360" max ="360" step="1" value={rotateX} onChange={(e) => {handleMatrixChange("rotateX", e.target.value)}}/>
            <InputContainer>
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
              <Input value={rotateX} onChange={(e) => {handleMatrixChange("rotateX", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number"></Input>
            </InputContainer>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Y: </Subtitle>
            <Slider type="range" min="-360" max ="360" step="1" value={rotateY} onChange={(e) => {handleMatrixChange("rotateY", e.target.value)}}/>
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
              <Input value={rotateY} onChange={(e) => {handleMatrixChange("rotateY", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number"></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Z: </Subtitle>
            <Slider type="range" min="-360" max ="360" step="1" value={rotateZ} onChange={(e) => {handleMatrixChange("rotateZ", e.target.value)}}/>
            {/* <Input value={`${rotateZ}°`} onChange={(e) => {let newValue = e.target.value.replace("°", ""); handleMatrixChange("rotateZ", newValue); }} inputProps={{type: 'number', pattern: "-?[0-9]*"}} ></Input> */}
            <Input value={rotateZ} onChange={(e) => {handleMatrixChange("rotateZ", e.target.value)}} inputProps={{ pattern: "-?[0-9]*"}} type="number"></Input>
          </SliderContainer>
        </SettingContainer>

          <MatrixContainer>
            <Subtitle>Transformation Matrix</Subtitle>

              <GridContainer>
                {matrix.flat().map((value, index) => (
                  <GridCell key={index}>
                    {value % 1 === 0 ? value : value.toFixed(2)}
                  </GridCell>
                ))}
              </GridContainer>
          </MatrixContainer>


        <ResetButton onClick={onReset}>Reset</ResetButton>
        
      </TransformContainer>
  )
}

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
width: calc(100% - 3rem);
jutify-content: center;
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
`;
