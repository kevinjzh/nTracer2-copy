import './App.css';
import Menu from './Menu'
import { SocketContext } from './Context'
import { useEffect, useState, useReducer, useRef } from 'react'
import styled from 'styled-components/macro'
import { io } from 'socket.io-client';
export const BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT}`

function App() {
  const [data, setData] = useState(null); //Data is name, type
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socket = useRef(null);
  const [activeLayer, setActiveLayer] = useState(null);
  const [layerOps, setLayerOps] = useState({});

  const saveLayerState = (layerName, matrix) => {
    setLayerOps((prevLayerOps) => ({
        ...prevLayerOps,
        [layerName]: prevLayerOps[layerName] ? [...prevLayerOps[layerName], matrix] : [matrix],
    }));
    console.log("Layer state saved:", layerName, matrix);
  };
  
  useEffect(() => {
    console.log(`Initializing Socket.IO connection to ${BASE_URL}`);
  
    if (!socket.current) {
      socket.current = io(BASE_URL, {
        path: '/socket.io/',
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
        extraHeaders: {
          "Origin": window.location.origin
        },
        withCredentials: true
      });
  
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
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
          }
        });
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching layers:', error);
      }
    };
  
    fetchLayers();
  
    if (socket.current) {
      socket.current.on('layers-updated', (updated) => {
        if (updated?.layers) {
          //console.log("Received updated layers via socket:", updated.layers);
          const layerArray = Object.entries(updated.layers).map(([name, info]) => ({
            name,
            type: info.type
          }));
          setData(layerArray);
        } else {
          fetchLayers(); // fallback if backend didn't send full data
        }
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
    <Main>
      <DashboardText>Dashboard</DashboardText>

      <Ribbon>
        <Button>Edit</Button>
        <Button>Plug-ins</Button>
        <Button>System1</Button>
        <Button>System2</Button>
        <Button>System3</Button>
      </Ribbon>

      <Container>
        <RightContainer>
          <PanelHeader>Neuroglancer Layers</PanelHeader>
          <HeaderRow>
            <LayerTitle>Name</LayerTitle>
            <LayerTitle>Layer Type</LayerTitle>
          </HeaderRow>
          <LayerList 
            data={data} 
            activeLayer={activeLayer} 
            setActiveLayer={setActiveLayer} 
            layerOps={layerOps}
          />
        </RightContainer>

        <RightContainer>
          <Menu
            saveLayerState={saveLayerState}
            activeLayerName={activeLayer?.name}
            layerOps={layerOps}
          />
        </RightContainer>
      </Container>
    </Main>
  );
}

const LayerList = ({ data, activeLayer, setActiveLayer, layerOps }) => {
  const [toggleStates, setToggleStates] = useState({});

  // Initialize toggle states to visible
  useEffect(() => {
    if (data) {
      setToggleStates((prevStates) => {
        const updatedStates = { ...prevStates };
        data.forEach(layer => {
          if (!(layer.name in updatedStates)) {
            updatedStates[layer.name] = true;
          }
        });
        return updatedStates;
      });
    }
  }, [data]);

  const handleToggle = async (layerName) => {
    const newVisible = !toggleStates[layerName]; // flip visibility state

    setToggleStates((prevStates) => ({
      ...prevStates,
      [layerName]: newVisible,
    }));

    try {
      await fetch(`${BASE_URL}/toggle_visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layerName,
          visible: newVisible,
        }),
      });
      console.log(`Set ${layerName} visibility to`, newVisible);
    } catch (err) {
      console.error("Error toggling layer visibility:", err);
    }
  };

  return (
    <div>
      {data ? (
        data.map((layer, index) => (
          <div key={index}>
            <button
              onClick={() => handleToggle(layer.name)}
              style={{
                marginRight: '8px',
                backgroundColor: toggleStates[layer.name] ? 'green' : 'red',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              {toggleStates[layer.name] ? 'On' : 'Off'}
            </button>
            <LayerButton
              isActive={activeLayer?.name === layer.name}
              onClick={() => {
                if (activeLayer?.name === layer.name) {
                  setActiveLayer(null);
                } else {
                  setActiveLayer(layer);
                }
              }}
            >
              <span>{layer.name}</span>
              <em>{layer.type}</em>
            </LayerButton>
            <DropdownMenu
              layerName={layer.name}
              transformations={layerOps[layer.name]}
            />
          </div>
        ))
      ) : (
        <LoadingText>Loading...</LoadingText>
      )}
    </div>
  );
};

const DropdownMenu = ({ layerName, transformations }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
      <div>
          <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? 'Hide Transformations' : 'Show Transformations'}
          </button>
          {isOpen && (
              <ul>
                  {transformations ? (
                      transformations.map((transformation, index) => (
                          <li key={index}>{JSON.stringify(transformation)}</li>
                      ))
                  ) : (
                      <li>No transformations saved for {layerName}</li>
                  )}
              </ul>
          )}
      </div>
  );
};

const Main = styled.div`
display: flex;
flex-direction: column;
height: 100vh;
overflow: auto;
`

const LayerTitle = styled.span`
font-size:0.8rem;
font-weight: bold;
`

const DashboardText = styled.h1`
margin-left: 20px;
`

const Ribbon = styled.div`
display: flex;
justify-content: space-around;
background-color: #f0f0f0;
padding: 10px;
border-radius: 5px;
margin-bottom: 20px;
`;

const Button = styled.button`
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

const Container = styled.div`
display: flex;
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
const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-weight: bold;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #ccc;
`;

const LayerButton = styled.button`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  background-color: ${({ isActive }) => (isActive ? '#e6f7ff' : '#fff')};
  border: 1px solid ${({ isActive }) => (isActive ? '#1890ff' : '#ddd')};
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  margin-top: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  text-align: left;

  &:hover {
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }

  span {
    font-weight: 500;
    font-size: 0.9rem;
  }

  em {
    font-size: 0.9rem;
    color: #666;
    font-style: normal;
  }
`;



const LoadingText = styled.p`
  font-size: 1rem;
  color: #888;
  font-style: italic;
`;

export default App;