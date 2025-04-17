import './App.css';
import Menu from './Menu'
import { SocketContext } from './Context'
import { useEffect, useState, useReducer, useRef } from 'react'
import styled from 'styled-components/macro'
import { io } from 'socket.io-client';
export const BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT}`

function App() {
  const [data, setData] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socket = useRef(null);
  
  useEffect(() => {
    console.log(`Initializing Socket.IO connection to ${BASE_URL}`);
    
    // Handle socket.IO connection
    if (!socket.current) {
      socket.current = io(BASE_URL, {
        path: '/socket.io/',
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
        // Important: Send proper origin information
        extraHeaders: {
          "Origin": window.location.origin
        },
        // Use withCredentials for CORS requests
        withCredentials: true
      });
      
      // Connection event handling
      socket.current.on('connect', () => {
        console.log('Socket.IO connected successfully with ID:', socket.current.id);
        setSocketConnected(true);
        setConnectionError(null);
      });
      
      socket.current.on('connection_established', (data) => {
        console.log('Server confirmed connection:', data);
      });
      
      socket.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setSocketConnected(false);
        setConnectionError(`Connection error: ${error.message}`);
      });

      socket.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setSocketConnected(false);
        setConnectionError(`Disconnected: ${reason}`);
      });
    }
    
    const fetchLayers = async () => {
      try {
        console.log('Fetching layers from:', `${BASE_URL}/layers`);
        const response = await fetch(`${BASE_URL}/layers`, {
          // Add CORS headers to regular fetch requests too
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
          }
        });
        const json = await response.json();
        console.log('Layers received:', json);
        setData(json);
      } catch (error) {
        console.error('Error fetching layers:', error);
      }
    };
    
    fetchLayers();
    
    // Event listener for layer updates
    if (socket.current) {
      socket.current.on('layers-updated', () => {
        console.log('Received layers-updated event!');
        fetchLayers();
      });
    }
    
    return () => {
      if (socket.current) {
        socket.current.off('layers-updated');
        socket.current.off('connect');
        socket.current.off('disconnect');
        socket.current.off('connect_error');
        socket.current.off('connection_established');
      }
    };
  }, []);
  
  return (
    <Container>
      <RightContainer>
        <PanelHeader>Neuroglancer Layers</PanelHeader>
        {data ? (
          data
            .map((layer, index) => (
              <LayerButton
                key={index}
                onClick={() => console.log(`Clicked layer: ${layer.name}`)}
              >
                <span>{layer.name}</span>
                <em>{layer.type}</em>
              </LayerButton>
            ))
        ) : (
          <LoadingText>Loading...</LoadingText>
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
/* box-shadow: -5px 0px 10px 5px rgba(0,0,0,0.1); */
z-index: 999;
`

const PanelHeader = styled.h3`
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
`;

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
const LayerButton = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }

  em {
    font-size: 0.9rem;
    color: #666;
  }
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: #888;
  font-style: italic;
`;

export default App;
