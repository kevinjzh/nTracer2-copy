import './App.css';
import styled from 'styled-components/macro'
import { DashboardContext } from './DashboardReducer';
import { useContext } from 'react';

export default function OverlayMenu() {
  const [dashboardState, dashboardDispatch] = useContext(DashboardContext)

  const onAllPointsSelected = (e) => {
    dashboardDispatch({
      type: 'setHighlightAll',
      payload: {
        highlightAll: e.target.checked
      }
    })
  }

  const onSelectedPointsSelected = (e) => {
    dashboardDispatch({
      type: 'setHighlightSelected',
      payload: {
        highlightSelected: e.target.checked
      }
    })
  }

  return (
      <OverlayContainer>
          {/* <Subtitle>All Traced</Subtitle> */}
          <Subtitle>Annotations</Subtitle>
          <BorderContainer>
              <Container>
            {/* <div>
              <span>+ / -</span>
              <input type="number" id="+/-" style={{marginLeft:5,  marginRight:30}}/>
              <br />
              <br />
              <input type="checkbox" id="name" style={{marginLeft:5}} />
              <label for="name">Name</label>
              <br />
              <input type="checkbox" id="soma" style={{marginLeft:5}}/>
              <label for="soma">Soma</label>
              <br />
              <input type="checkbox" id="neuron" style={{marginLeft:5}}/>
              <label for="neuron">Neuron</label>
              <br />
            </div> */}
            <Row>
              <input type="checkbox" onChange={onAllPointsSelected} checked={dashboardState.highlight_all} />
              <InputLabel for="allpoints">All Points</InputLabel>
              <br />
              <br />
              {/* <input type="checkbox" id="spine" style={{marginLeft:-15}}/>
              <label for="spine">Spine</label>
              <br />
              <input type="checkbox" id="synapse" style={{marginLeft:-15}}/>
              <label for="synapse">Synapse</label>
              <br />
              <input type="checkbox" id="connection" style={{marginLeft:-15}}/>
              <label for="connection">Connection</label> */}
            </Row>
          </Container>
          {/* <br />
          <span>Line-width offset</span>
          <input type="number" id="+/-" style={{marginLeft:5,  marginRight:30}}/> */}
        </BorderContainer>

        {/* <Subtitle>Selected</Subtitle> */}
        <BorderContainer>
          <Container>
            {/* <div>
              <span>+ / -</span>
              <input type="number" id="+/-" style={{marginLeft:5,  marginRight:30}}/>
            </div> */}
            <Row>
              <input type="checkbox" onChange={onSelectedPointsSelected} checked={dashboardState.highlight_selected} />
              <InputLabel for="allpoints2">Selected Points</InputLabel>
            </Row>
          </Container>
          {/* <Container>
            <div>
              <input type="checkbox" id="name2" style={{marginLeft:5}}/>
              <label for="name2">Name</label>
              <br />
              <br />
              <input type="checkbox" id="soma2" style={{marginLeft:5}}/>
              <label for="soma2">Soma</label>
              <br />
              <br />
              <input type="checkbox" id="neuron2" style={{marginLeft:5}}/>
              <label for="neuron2">Neuron</label>
              <br />
              <br />
              <input type="checkbox" id="arbor2" style={{marginLeft:5}}/>
              <label for="arbor2">Arbor</label>
              <br />
              <br />
              <input type="checkbox" id="branch2" style={{marginLeft:5}}/>
              <label for="branch2">Branch</label>
              <br />
              <br />
              <input type="checkbox" id="spine2" style={{marginLeft:5}}/>
              <label for="spine2">Spine</label>
              <br />
              <br />
              <input type="checkbox" id="synapse2" style={{marginLeft:5}}/>
              <label for="synapse2">Synapse</label>
              <br />
              <br />
              <input type="checkbox" id="point2"  style={{marginLeft:5}}/>
              <label for="point2">Point</label>
              <br />
              <br />
            </div>
            <div style={{marginLeft:15}}>
              <button style={{width:50, height:17, marginLeft:-15,  marginTop:5, padding:0, fontSize: "1em"}}>Update</button>
              <br />
              <SmallInput type="number" id="+/-" />
              <br />
              <SmallInput type="number" id="+/-" />
              <SmallInput type="number" id="+/-" />
              <SmallInput type="number" id="+/-" />
              <SmallInput type="number" id="+/-" />
              <SmallInput type="number" id="+/-" />
              <SmallInput type="number" id="+/-" />
              <br />
            </div>
            <div>
              <input type="checkbox" id="color3" style={{marginLeft:5, marginTop:7}}/>
              <label for="color3">Color</label>
              <br />
              <input type="checkbox" id="con" style={{marginLeft:5, marginTop:174}}/>
              <label for="con">Con</label>
              <br />
              <input type="number" id="+/-" style={{marginTop:12, marginLeft:5}}/>
            </div>
          </Container> */}
        </BorderContainer>
        <br  />
        <br  />
        {/* <BorderContainer>
          <Container>
            <label for="roicolor">ROI Color:</label>
            <select name="roicolor" id="roicolor">
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
            </select>
          </Container>
          <Container style={{display: 'block'}}>
            <label for="roicolor">ROI Color:</label>
            <button style={{width:90}}>Choose File</button>
            <br></br>
            <button  style={{marginLeft:48, width:90}}>Clear ROIS</button>
          </Container>
        </BorderContainer> */}
      </OverlayContainer>
  )
}

const OverlayContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`

const FlexContainer = styled.div`
  display: flex;
`

const BorderContainer = styled.div`
width: 80%;
border-radius: 5px;
margin-left: 1rem;
background-color: #f5f5f5;
margin-top: 1rem;
`

const Container = styled.div`
display: flex;
`

const Row = styled.div`
display: flex;
align-items: center;
padding: 1rem;
`

const InputLabel = styled.label`
margin-left: 1rem;
font-size: 0.9rem;
font-weight: 400;
`

const Subtitle = styled.h3`
margin: 0;
padding: 0;
margin-left: 1rem;
margin-top: 0.5rem;
font-size: 1rem;
`

const SmallInput = styled.input`
margin-top: 11px;
`
