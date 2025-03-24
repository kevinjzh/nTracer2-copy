import './App.css';
import { useState, useContext } from 'react'
import { SocketContext } from './Context'
import { DashboardContext } from './DashboardReducer'
import styled from 'styled-components/macro'
import { BASE_URL } from './App'

export default function EditMenu({ deleteNeuron, deleteBranch, deletePoint, submitCoordinates, completeSoma }) {
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [z, setZ] = useState(null);

  const [dashboardState, dashboardDispatch] = useContext(DashboardContext)

  const onSubmitCoordinates = () => {
    if (!x || !y || !z) {
      return;
    }

    submitCoordinates([x, y, z])
  }

  const onDeleteNeuron = () => {
    fetch(`${BASE_URL}/neuron/delete`)
  }

  const onDeleteSoma = () => {
    fetch(`${BASE_URL}/soma/delete`)  
  }

  const onNeuronCombine = () => {
    fetch(`${BASE_URL}/neuron/combine`)
  }

  const onExpandAll = () => {
    dashboardDispatch({
      type: 'treeExpandAll'
    })
  }

  const onCollapseAll = () => {
    dashboardDispatch({
      type: 'treeCollapseAll'
    })
  }

  const onBranchBreak = () => {
    fetch(`${BASE_URL}/branch/break`)
  }

  const onSetPrimaryBranch = () => {
    fetch(`${BASE_URL}/branch/set_primary`)
  }

  const onJoinBranch = () => {
    fetch(`${BASE_URL}/branch/join`)
  }

    return (
        <>
          <FlexContainer>
            <Column>
              <Subtitle>Branch</Subtitle>
              <BorderContainer width={4}>
                <MediumButton onClick={onSetPrimaryBranch}>Set Primary</MediumButton>
                <br />
                <MediumButton onClick={onJoinBranch}>Join</MediumButton>
                <br />
                <MediumButton onClick={onBranchBreak}>Break</MediumButton>
              </BorderContainer>
              <Subtitle>Neuron</Subtitle>
              <BorderContainer width={4}>
                <MediumButton onClick={onNeuronCombine}>Combine Multiple</MediumButton>
                <br />
                {/* <SmallButton onClick={onExpandAll}>Exapand All</SmallButton>
                <br />
                <SmallButton onClick={onCollapseAll}>Collapse All</SmallButton> */}
              </BorderContainer>
              {/* <Subtitle>JumpTo Next</Subtitle>
              <BorderContainer>
                <LargeButton style={{marginTop: 10}}>Incomplete</LargeButton>
                <br />
                <LargeButton>Selected</LargeButton>
                <br />
                <LargeButton>Synapse</LargeButton>
                <br />
                <LargeButton>Connected</LargeButton>
              </BorderContainer> */}
            </Column>
            <Column>
              <Subtitle>Delete</Subtitle>
              <BorderContainer width={4.2}>
                <MediumButton onClick={deleteBranch}>1 Branch</MediumButton>
                <br />
                <MediumButton onClick={onDeleteNeuron}>Neuron</MediumButton>
                <br />
                <MediumButton onClick={onDeleteSoma}>Soma</MediumButton>
                <br />
                <MediumButton onClick={deletePoint}>Point</MediumButton>
              </BorderContainer>
              <div class="fixed" style={{marginLeft: 5}}>
                <Subtitle>Soma</Subtitle>
                <BorderContainer width={4.2}>
                  <MediumButton onClick={completeSoma}>Complete</MediumButton>
                </BorderContainer>
                {/* <Subtitle>Synapse</Subtitle>
                <BorderContainer width={4.2}>
                  <MediumButton>Type +</MediumButton>
                  <MediumButton>Type -</MediumButton>
                </BorderContainer>
                <Subtitle>Connection</Subtitle>
                <BorderContainer width={4.2}>
                  <MediumButton>+ / -</MediumButton>
                  <MediumButton>GOTO</MediumButton>
                </BorderContainer> */}
              </div>
            </Column>
          </FlexContainer>   
          {/* <Subtitle>Coordinate Selection</Subtitle>
          <BorderContainer width={167} style={{paddingTop: 10, paddingBottom: 10, textAlign: 'center'}}>
            <span>X Coordinate</span>
            <CoordinateInput type="number" id="x_coordinate" onChange={(evt)=>setX(evt.target.value)}/>
            <br />
            <span>Y Coordinate</span>
            <CoordinateInput type="number" id="y_coordinate" onChange={(evt)=>setY(evt.target.value)}/>
            <br />
            <span>Z Coordinate</span>
            <CoordinateInput type="number" id="z_coordinate" onChange={(evt)=>setZ(evt.target.value)}/>
            <br />
            <br />
            <button id="submission" onClick={onSubmitCoordinates} type="button" >Submit Coordinates</button>   
          </BorderContainer> */}
        </>
    )
}

const Subtitle = styled.h3`
margin: 1rem 0 0.25rem 0.8rem;
font-weight: 300;
font-size: 1.1rem;
`


const FlexContainer = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  align-items: stretch;
`

const SmallButton = styled.button`
width: 70px;
margin-bottom: 0.3rem;
`

const MediumButton = styled.button`
width: 100%;
margin-bottom: 0.3rem;
font-size: 1.3em;
font-weight: 800;
color: rgba(0,0,0,0.8);
background-color: rgba(0,0,0,0.1);
border: none;
padding: 0.7rem;
border-radius: 5px;
cursor: pointer;
`

const LargeButton = styled.button`
width: 76px;
margin-bottom: 0.3rem;
`

const BorderContainer = styled.div`
border-radius: 5px;
margin: 0.3rem;
margin-top: 0;
padding: 0.5rem;
padding-top: 0.7rem;
align-items: center;
text-align: center;
`

const CoordinateInput = styled.input`
margin-left: 10px;
`
const Column = styled.div`
flex: 1;
:first-child {
  margin-right: 10px;
}
`