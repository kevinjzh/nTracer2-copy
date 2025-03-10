import './App.css';
import styled from 'styled-components/macro'
import { DashboardContext } from './DashboardReducer';
import { useContext, useState, useEffect } from 'react'
import { BASE_URL } from './App'

export default function TransformMenu() {
  const [dashboardState, dashboardDispatch] = useContext(DashboardContext)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)
  const [scale, setScale] = useState(1)
  const [reflectX, setReflectX] = useState(1)
  const [reflectY, setReflectY] = useState(1)
  const [reflectZ, setReflectZ] = useState(1)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)



  useEffect(() => {
    dashboardDispatch({
      type: 'updateAllProperties',
      payload: {
        newState: {
          ...dashboardState,
          tracing_sensitivity: translateX,
        }
      }
    })
  }, [translateX, translateY, translateZ])

  const onSubmit = async (e) => {
    e.preventDefault(); // Prevent form reload

    const translationData = {
        translateX,
        translateY,
        translateZ
    };

    try {
        const response = await fetch(`${BASE_URL}/apply_translation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(translationData)
        });

    } catch (error) {
        console.error("Error submitting translation:", error);
    }
  };


  return (
      <TransformContainer>
        <SettingContainer>
          <SubtitleTransform>Translate in X, Y, or Z-axis</SubtitleTransform>
          <SliderContainer>
            <Subtitle>X: </Subtitle>
            <Slider type="range" min="-100" max ="100" step="1" value={translateX} onChange={(e) => {setTranslateX(parseInt(e.target.value) || 0)}} aria-labelledby='inputX'/>
            <Input value={translateX} onChange={(e) => {setTranslateX(parseInt(e.target.value) || 0)}} inputProps={{type: 'number', 'aria-labelledby': 'inputX'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Y: </Subtitle>
            <Slider type="range" min="-100" max ="100" id="slider" step="1" value={translateY} onChange={(e) => {setTranslateY(parseInt(e.target.value) || 0)}}/>
            <Input value={translateY} onChange={(e) => {setTranslateY(parseInt(e.target.value))}} inputProps={{type: 'number'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Z: </Subtitle>
            <Slider type="range" min="-100" max ="100" id="slider" step="1" value={translateZ} onChange={(e) => {setTranslateZ(parseInt(e.target.value))}} aria-labelledby='inputZ'/>
            <Input value={translateZ} onChange={(e) => {setTranslateZ(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'inputZ'}} ></Input>
          </SliderContainer>
        </SettingContainer>

        <SettingContainer>
          <SubtitleTransform>Scale isotropically</SubtitleTransform>
          <SliderContainer>
            <Subtitle>C: </Subtitle>
            <Slider type="range" min="0.1" max ="2" id="slider" step="0.01" value={scale} onChange={(e) => {setScale(parseFloat(e.target.value) || 0)}} aria-labelledby='scale'/>
            <Input value={scale} onChange={(e) => {setScale(parseFloat(e.target.value) || 0)}} inputProps={{type: 'number', 'aria-labelledby': 'scale'}} ></Input>
          </SliderContainer>
        </SettingContainer>

        <SettingContainer>
          <SubtitleTransform>Reflect on X, Y, or Z-axis</SubtitleTransform>
          <ReflectContainer>
            <ReflectAxisContainer>
              <Subtitle>X: </Subtitle>
              <input type="checkbox" value={reflectX} onChange={(e) => {setReflectX(parseInt(e.target.value))}} />
            </ReflectAxisContainer>

            <ReflectAxisContainer>
              <Subtitle>Y: </Subtitle>
              <input type="checkbox" value={reflectY} onChange={(e) => {setReflectY(parseInt(e.target.value))}} />
            </ReflectAxisContainer>

            <ReflectAxisContainer>
              <Subtitle>Z: </Subtitle>
              <input type="checkbox" value={reflectZ} onChange={(e) => {setReflectZ(parseInt(e.target.value))}} />
            </ReflectAxisContainer>
          </ReflectContainer>
        </SettingContainer>

        <SettingContainer>
          <SubtitleTransform>Rotate in X, Y, or Z-axis</SubtitleTransform>
          <SliderContainer>
            <Subtitle>X: </Subtitle>
            <Slider type="range" min="-360" max ="360" id="slider" step="1" value={rotateX} onChange={(e) => {setRotateX(parseInt(e.target.value) || 0)}} aria-labelledby='rotateX'/>
            <Input value={rotateX} onChange={(e) => {rotateX(parseInt(e.target.value) || 0)}} inputProps={{type: 'number', 'aria-labelledby': 'rotateX'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Y: </Subtitle>
            <Slider type="range" min="-360" max ="360" id="slider" step="1" value={rotateY} onChange={(e) => {setRotateY(parseInt(e.target.value) || 0)}} aria-labelledby='rotateY'/>
            <Input value={rotateY} onChange={(e) => {setRotateY(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'rotateY'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Z: </Subtitle>
            <Slider type="range" min="-360" max ="360" id="slider" step="1" value={rotateZ} onChange={(e) => {setRotateZ(parseInt(e.target.value) || 0)}} aria-labelledby='rotateZ'/>
            <Input value={rotateZ} onChange={(e) => {setRotateZ(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'rotateZ'}} ></Input>
          </SliderContainer>
        </SettingContainer>

        <form name="import-form">
          <SubmitInput type="submit" value="Submit" onClick={onSubmit}/>
        </form>
      </TransformContainer>
  )
}

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

const SubmitInput = styled.input`
margin-top: 1rem;
padding: 0.5rem 1rem;
border: none;
border-radius: 0.5rem;
font-size: 0.9rem;
cursor: pointer;
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
