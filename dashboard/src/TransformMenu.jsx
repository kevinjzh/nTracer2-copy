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

  const onTransform = async (e) => {
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
            body: JSON.stringify(translationData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server response:", data);
    } catch (error) {
        console.error("Error submitting translation:", error);
    }
  };

  return (
      <TransformContainer>
        <SettingContainer>
          <SubtitleTransform>Translate in X, Y, or Z axis</SubtitleTransform>
          <SliderContainer>
            <Subtitle>X: </Subtitle>
            <Slider type="range" id="slider" step="1" value={translateX} onChange={(e) => {setTranslateX(parseInt(e.target.value) || 0)}} aria-labelledby='inputX'/>
            <Input value={translateX} onChange={(e) => {setTranslateX(parseInt(e.target.value) || 0)}} inputProps={{type: 'number', 'aria-labelledby': 'input-slider'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Y: </Subtitle>
            <Slider type="range" id="slider" step="1" value={translateY} onChange={(e) => {setTranslateY(parseInt(e.target.value) || 0)}} aria-labelledby='inputY'/>
            <Input value={translateY} onChange={(e) => {setTranslateX(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'input-slider'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Z: </Subtitle>
            <Slider type="range" id="slider" step="1" value={translateZ} onChange={(e) => {setTranslateZ(parseInt(e.target.value))}} aria-labelledby='inputZ'/>
            <Input value={translateZ} onChange={(e) => {setTranslateX(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'input-slider'}} ></Input>
          </SliderContainer>
        </SettingContainer>

        <form name="import-form">
          <SubmitInput type="submit" value="Submit" onClick={onTransform}/>
        </form>
      </TransformContainer>
  )
}

const TransformContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`
const SubtitleTransform = styled.h3`
margin: 0;
padding: 0;
margin-left: 1rem;
margin-top: 0.5rem;
font-size: 1rem;
`

const Subtitle = styled.h3`
`

const SettingContainer = styled.div`
width: calc(100% - 3rem);
margin-left: 1rem;
`

const SliderContainer = styled.div`
display: flex;
width: 100%;
`

const Slider = styled.input`
flex: 1;
`
const Input = styled.input`
  width: 50px;
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  margin-left: 0.5em;
`;

const SubmitInput = styled.input`
margin-top: 1rem;
padding: 0.5rem 1rem;
border: none;
border-radius: 0.5rem;
font-size: 0.9rem;
cursor: pointer;
`
