import './App.css';
import Menu from './Menu'
import { SocketContext } from './Context'
import { useEffect, useState, useReducer, useRef } from 'react'
import styled from 'styled-components/macro'
import { io } from 'socket.io-client';
export const BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT}`

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {    
    const fetchLayers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/layers`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching layers:', error);
      }
    };
  
    fetchLayers();    
  }, []);
  
  return (
    <Container>
      <RightContainer>
        <h2>Neuroglancer Layers</h2>
        {data ? (
          data.map((layer, index) => (
            <button
              key={index}
              onClick={() => console.log(`Clicked layer: ${layer.name}`)}
              style={{
                display: 'block',
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {layer.name} — <em>{layer.type}</em>
            </button>
          ))
        ) : (
          <p>Loading...</p>
        )}
      </RightContainer>

      <RightContainer>
          <Menu />
      </RightContainer>
    </Container>
  );
}

const Container = styled.div`
display: flex;
overflow: hidden;
width: 100vw;
height: 100vh;
`

const LeftContent = styled.div`
height: 100%;
width: calc(100% - 20rem);
`

const MainContainer = styled.div`
display: flex;
position: relative;
height: 100%;
`

const Header = styled.div`
background-color: rgba(0,0,0,0.8);
padding: 0.5rem 0 0.5rem 0.5rem;
`

const HeaderText = styled.h1`
margin: 0;
margin-left: 1rem;
font-weight: 700;
font-size: 1.4em;
color: rgba(0, 0, 0, 0.85);
color: rgba(255, 255, 255, 0.9);
`

const HeaderSmallText = styled.h2`
margin: 0;
margin-left: 1rem;
font-size: 0.85em;
font-weight: 300;
color: rgba(0, 0, 0, 0.8);
color: rgba(255, 255, 255, 0.9);
`

const LeftContainer = styled.div`
display: flex;
flex-direction: column;
flex: 1;
/* border: 1px solid rgba(0, 0, 0, 0.6);
border-radius: 5px; */
/* margin-right: 1rem; */
font-size: 30px;
`

const RightContainer = styled.div`
display: flex;
width: 25rem;
flex-direction: column;
/* border: 1px solid rgba(0, 0, 0, 0.6); */
border-radius: 5px;
font-size: 30px;
padding: 2rem 1rem 1rem 1rem;
box-shadow: -5px 0px 10px 5px rgba(0,0,0,0.1);
z-index: 999;
`

const WhiteContainer = styled.div`
display: flex;
height: 50%;
background-color: #ffffff;
overflow: auto;
padding-bottom: 1rem;
`

const TreeControl = styled.div`
display: flex;
flex-direction: column;
flex-shrink: 1;
border: 1px solid;
text-align: center;
padding: 0.5rem;
`

const TreeControlButton = styled.button`
margin: 0.5rem;
width: 4rem;
`

const Folders = styled.div`
/* border: 1px solid rgba(0, 0, 0, 0.6); */
/* border-radius: 5px; */
text-align: left;
flex: 3;
padding: 0.5rem;
overflow: auto;
`

const SomaContainer = styled.div`
display: flex;
flex-shrink: 1;
background-color: #ffffff;
overflow: auto;
`

export default App;
