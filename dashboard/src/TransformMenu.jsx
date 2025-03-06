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

  const getNeuroglancerState = async (port = 8050) => {
    try {
        const neuroglancerWindow = window.open(`http://localhost:${port}/v/ntracer2/`);
        console.log(neuroglancerWindow.Viewer.state.toJSON())
        if (!neuroglancerWindow) {
          console.error("Could not access Neuroglancer on the specified port.");
          return;
        }

        // Get the current state from Neuroglancer
        const viewerState = JSON.stringify(neuroglancerWindow.Viewer.state.toJSON());
        console.log("Current Neuroglancer State:", viewerState);
        return viewerState;
    } catch (error) {
        console.error("Error retrieving Neuroglancer state:", error);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault(); // Prevent form reload

    const viewerState = await getNeuroglancerState();

    const translationData = {
        translateX,
        translateY,
        translateZ,
        viewerState
    };

    try {
        const response = await fetch(`http://localhost:8050/v/ntracer2/apply_translation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(translationData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Updated Neuroglancer URL:", responseData.updatedViewerUrl);
        // Update window.location.href to reflect new transformation state
        window.location.href = responseData.updatedViewerUrl;

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
            <Slider type="range" min="-100" max ="100" id="slider" step="1" value={translateX} onChange={(e) => {setTranslateX(parseInt(e.target.value) || 0)}} aria-labelledby='inputX'/>
            <Input value={translateX} onChange={(e) => {setTranslateX(parseInt(e.target.value) || 0)}} inputProps={{type: 'number', 'aria-labelledby': 'input-slider'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Y: </Subtitle>
            <Slider type="range" min="-100" max ="100" id="slider" step="1" value={translateY} onChange={(e) => {setTranslateY(parseInt(e.target.value) || 0)}} aria-labelledby='inputY'/>
            <Input value={translateY} onChange={(e) => {setTranslateY(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'input-slider'}} ></Input>
          </SliderContainer>

          <SliderContainer>
            <Subtitle>Z: </Subtitle>
            <Slider type="range" min="-100" max ="100" id="slider" step="1" value={translateZ} onChange={(e) => {setTranslateZ(parseInt(e.target.value))}} aria-labelledby='inputZ'/>
            <Input value={translateZ} onChange={(e) => {setTranslateZ(parseInt(e.target.value))}} inputProps={{type: 'number', 'aria-labelledby': 'input-slider'}} ></Input>
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
