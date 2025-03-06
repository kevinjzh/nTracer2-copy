import './App.css';
import EditMenu from './EditMenu'
import { ExportMenu } from './ExportMenu';
import OverlayMenu from './OverlayMenu'
import TracingMenu from './TracingMenu'
import TransformMenu from './TransformMenu'
import {useState} from 'react'
import styled from 'styled-components/macro'

export default function SideMenu({ deleteNeuron, deleteBranch, deletePoint, submitCoordinates, completeSoma }) {
    const [tabIndex, setTabIndex] = useState(0);   
    let selectedTabMenu;
    switch (tabIndex) {
        case 0:
            selectedTabMenu = <EditMenu deleteNeuron={deleteNeuron}
                                        deleteBranch={deleteBranch}
                                        deletePoint={deletePoint}
                                        submitCoordinates={submitCoordinates}
                                        completeSoma={completeSoma}
                                        />
            break;
        case 1:
            selectedTabMenu = <OverlayMenu />
            break;
        case 2:
            selectedTabMenu = <TracingMenu />
            break;
        case 3:
            selectedTabMenu = <TransformMenu />
            break;
        case 4:
            selectedTabMenu = <ExportMenu />
            break;
        default:
            break;
    } 

    return (
        <>
            <TabButtonContainer >
                <TabButton onClick={()=>{setTabIndex(0)}} selected={tabIndex == 0}>Edit</TabButton>
                <TabButton onClick={()=>{setTabIndex(1)}} selected={tabIndex == 1}>Overlay</TabButton>
                <TabButton onClick={()=>{setTabIndex(2)}} selected={tabIndex == 2}>Tracing</TabButton>
                <TabButton onClick={()=>{setTabIndex(3)}} selected={tabIndex == 3}>Transform</TabButton>
                <TabButton onClick={()=>{setTabIndex(4)}} selected={tabIndex == 4}>SWC</TabButton>
            </TabButtonContainer>
            <TabContent>
                {selectedTabMenu}
            </TabContent>
        </>
    )
}

const TabButtonContainer = styled.div`
margin-left: 1rem;
width: 90%;
display: flex;
`

const TabButton = styled.button`
background-color: ${(props)=>(props.selected) ? 'rgba(0, 0, 0, 0.8)': 'rgba(255, 255, 255, 0.9)'};
color: ${(props)=>(props.selected) ? 'white': 'rgba(0, 0, 0, 0.9)'};
float: left;
outline: none;
cursor: pointer;
padding: 0.5rem 0.8rem;
transition: 0.3s;
font-size: 12px;
font-weight: 700;
border-top: 1px solid rgba(0,0,0,0.6);
border-bottom: 1px solid rgba(0,0,0,0.6);
border-left: none;
border-right: 1px solid rgba(0,0,0,0.6);
display: block;
:first-child {
    border-radius: 5px 0 0 5px;
    border-left: 1px solid rgba(0,0,0,0.6);
}
:last-child {
    border-radius: 0 5px 5px 0;
    border-right: 1px solid rgba(0,0,0,0.6);
}
width: 25%;
`

const TabContent = styled.div`
display: flex;
flex-direction: column;
padding: 0.3rem;
/* border: 1px solid #ccc; */
border-top: none;
font-size: 10px;
margin-top: 0.5rem;
/* background-color: rgb(225, 225, 225); */
align-items: center;
`