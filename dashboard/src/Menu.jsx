import './App.css';
import {useState} from 'react'
import TransformMenu from './TransformMenu'
import RenderMenu from './RenderMenu'
import styled from 'styled-components/macro'
import { BASE_URL } from './App'

export default function Menu({ saveLayerState, activeLayerName, activeLayerType, layerOps, trackTransforms, saveTrackTransforms }) {
    const [tabIndex, setTabIndex] = useState(0);   
    let selectedTabMenu;
    switch (tabIndex) {
        case 0:
            selectedTabMenu = <RenderMenu activeLayerName={activeLayerName} layerType={activeLayerType} />;
            break;
        case 1:
            selectedTabMenu = <TransformMenu saveLayerState={saveLayerState} activeLayerName={activeLayerName} layerOps={layerOps} trackTransforms={trackTransforms} saveTrackTransforms={saveTrackTransforms}/>;
            break;

        default:
            break;
    } 

    return (
        <>
            <TabButtonContainer >
                <TabButton onClick={()=>{setTabIndex(0)}} selected={tabIndex == 0}>Rendering</TabButton>
                <TabButton onClick={()=>{setTabIndex(1)}} selected={tabIndex == 1}>Transform</TabButton>
                <TabButton onClick={()=>{setTabIndex(2)}} selected={tabIndex == 2}>Processing</TabButton>
                <TabButton onClick={()=>{setTabIndex(3)}} selected={tabIndex == 3}>Analysis</TabButton>
                <TabButton onClick={()=>{setTabIndex(4)}} selected={tabIndex == 4}>Annotation</TabButton>
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