import './App.css';
import Menu from './Menu';
import { SocketContext } from './Context';
import { useEffect, useState, useReducer, useRef } from 'react';
import styled from 'styled-components/macro';
import { io } from 'socket.io-client';
export const BASE_URL = `http://localhost:${process.env.REACT_APP_SERVER_PORT}`;

function App() {
  const [data, setData] = useState(null); //Data is name, type, visible
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socket = useRef(null);
  const [activeLayer, setActiveLayer] = useState(null);
  const [layerOps, setLayerOps] = useState({});
  const [trackTransforms, setTrackTransforms] = useState({});

  const fileInputRef = useRef(null);
  const importModeRef = useRef(null);

  const [viewerReady, setViewerReady] = useState(false);


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const contents = e.target.result;
        const jsonData = JSON.parse(contents);

        if (importModeRef.current === 'layer') {
          // Import a single layer
          if (!jsonData.type) {
            alert("Invalid layer JSON: missing 'type' field.");
            return;
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("layer_name", file.name.replace(".json", ""));

          await fetch(`${BASE_URL}/import_layer`, {
            method: "POST",
            body: formData,
          });

          console.log("Layer imported. Now fetching updated viewer_state...");

        } else if (importModeRef.current === 'viewer') {
          // Import full viewer state
          if (!jsonData.layers) {
            alert("Invalid viewer state JSON: missing 'layers' field.");
            return;
          }

          const formData = new FormData();
          formData.append("file", file);

          await fetch(`${BASE_URL}/import_viewer`, {
            method: "POST",
            body: formData,
          });

          console.log("Viewer state imported. Now fetching updated viewer_state...");
        }

        // After ANY import, always fetch the *latest* viewer_state
        const afterStateRes = await fetch(`${BASE_URL}/viewer_state`);
        const afterState = await afterStateRes.json();
        console.log("📡 Sent updated viewer_state to Neuroglancer iframe:", afterState);

        // Always push updated viewer_state to iframe Neuroglancer
        tryPostViewerState(afterState);
      } catch (error) {
        alert("Failed to read or upload JSON: " + error.message);
        console.error("Import error:", error);
      }
    };

    reader.readAsText(file);
  };



  const handleImportStateJSON = () => {
    console.log("Triggering file input for layer import");
    importModeRef.current = "layer";
    console.log("Attempting to click:", fileInputRef.current);
    console.log("Is in DOM?", document.body.contains(fileInputRef.current));
    fileInputRef.current?.click();
  };

  const handleImportViewerJSON = () => {
    console.log("Triggering file input for viewer import");
    importModeRef.current = "viewer";
    fileInputRef.current?.click();
  };

  // const handleImportViewerJSON = () => {
  //   console.log("Triggering file input for viewer import");
  //   importModeRef.current = "viewer";
  //   console.log("Attempting to click:", fileInputRef.current);
  //   console.log("Is in DOM?", document.body.contains(fileInputRef.current));
  //   fileInputRef.current?.click();
  // };

  const handleExportJSON = () => {
    console.log('Export Layer clicked');
  };

  const handleUndo = () => {
    console.log('Undo clicked');
  };

  const handleRedo = () => {
    console.log('Redo clicked');
  };

  const loadPluginA = () => {
    console.log('Load Plugin A clicked');
  };

  const loadPluginB = () => {
    console.log('Load Plugin B clicked');
  };

  const saveLayerState = (layerName, matrix) => {
    setLayerOps((prevLayerOps) => ({
      ...prevLayerOps,
      [layerName]: prevLayerOps[layerName] ? [...prevLayerOps[layerName], matrix] : [matrix],
    }));
    console.log("Layer state saved:", layerName, matrix);
  };

  const saveTrackTransforms = (layerName, transformDescriptionOrUpdater) => {
    setTrackTransforms((prev) => {
      const current = prev[layerName] || [];

      const updated = typeof transformDescriptionOrUpdater === 'function'
        ? transformDescriptionOrUpdater(current)
        : Array.isArray(transformDescriptionOrUpdater)
          ? transformDescriptionOrUpdater
          : [...current, transformDescriptionOrUpdater];

      return {
        ...prev,
        [layerName]: updated,
      };
    });
  };

  const tryPostViewerState = (state, attempts = 5) => {
    const iframe = document.getElementById("interface");

    if (viewerReady && iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { "neuroglancer/set-state": state },
        "*"
      );
      console.log("📡 Sent updated viewer_state to Neuroglancer iframe:", state);
    } else if (attempts > 0) {
      console.warn("Viewer not ready, retrying in 250ms...");
      setTimeout(() => tryPostViewerState(state, attempts - 1), 250);
    } else {
      console.error("Failed to send viewer state after multiple attempts.");
    }
  };


  // const saveTrackTransforms = (layerName, transformDescription) => {
  //   setTrackTransforms((prev) => ({
  //     ...prev,
  //     [layerName]: typeof transformDescription === 'function'
  //       ? transformDescription(prev[layerName] || [])
  //       : [...(prev[layerName] || []), transformDescription]
  //   }));
  // };


  useEffect(() => {
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

      socket.current.on('viewer-state-updated', (updatedStateJson) => {
        console.log("📡 Received live updated viewer_state from backend:", updatedStateJson);
        const iframe = document.getElementById("interface");
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            { "neuroglancer/set-state": updatedStateJson },
            "*"
          );
        }
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
        console.log("Fetched JSON:", json);
        setData(json);
      } catch (error) {
        console.error('Error fetching layers:', error);
      }
    };

    fetchLayers();

    if (socket.current) {
      socket.current.on('layers-updated', (updated) => {
        if (updated?.layers) {
          const layerArray = Object.entries(updated.layers).map(([name, info]) => ({
            name,
            type: info.type,
            visible: info.visible !== false
          }));
          setData(layerArray);
        } else {
          fetchLayers(); // fallback
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

  useEffect(() => {
    const iframe = document.getElementById("interface");
    if (!iframe) {
      console.warn("No iframe found for viewer!");
      return;
    }

    let syncInterval = null;

    // ✅ Listen for messages from iframe
    const handleMessage = (event) => {
      // 1. Neuroglancer inside iframe tells us it’s ready
      if (event.data?.["neuroglancer-ready"]) {
        console.log("✅ Neuroglancer inside iframe is ready");
        setViewerReady(true);

        // ✅ Start periodic viewer_state sync *only after ready*
        syncInterval = setInterval(async () => {
          try {
            console.log("Fetching latest /viewer_state...");
            const res = await fetch(`${BASE_URL}/viewer_state`);
            const stateJson = await res.json();
            console.log("Fetched viewer_state:", stateJson);

            if (!stateJson.error) {
              iframe.contentWindow?.postMessage(
                { "neuroglancer/set-state": stateJson },
                "*"
              );
            }
          } catch (err) {
            console.error("Failed to fetch viewer_state:", err);
          }
        }, 2000);
      }
    };

    // ✅ Add listener for iframe postMessages
    window.addEventListener("message", handleMessage);

    // ✅ Cleanup on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, []);

  const handleDeleteLayer = async (layerName) => {
    try {
      // Call backend to delete
      await fetch(`${BASE_URL}/delete_layer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layerName }),
      });

      // ✅ Update local UI state
      setData((prevLayers) => prevLayers.filter((l) => l.name !== layerName));

      // ✅ Clear active layer if it was deleted
      if (activeLayer?.name === layerName) {
        setActiveLayer(null);
      }

      console.log(`Layer ${layerName} deleted successfully`);
    } catch (err) {
      console.error("Error deleting layer:", err);
    }
  };



  return (
    <SocketContext.Provider value={socket}>
      <Main>
        <DashboardText>Dashboard</DashboardText>

        <label htmlFor="jsonUploadInput" style={{ display: 'none' }} />
        <input
          id="jsonUploadInput"
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onClick={() => {
            fileInputRef.current.value = null;
          }}
          onChange={handleFileChange}
        />

        <Ribbon>
          <RibbonDropdown
            trigger={<RibbonButton>File</RibbonButton>}
            menuItems={[
              { label: 'Import Layer', onClick: handleImportStateJSON },
              { label: 'Import Viewer State', onClick: handleImportViewerJSON },
              { label: 'Export Layer', onClick: handleExportJSON },
            ]}
          />
          <RibbonDropdown
            trigger={<RibbonButton>Edit</RibbonButton>}
            menuItems={[
              { label: 'Undo', onClick: handleUndo },
              { label: 'Redo', onClick: handleRedo },
            ]}
          />
          <RibbonDropdown
            trigger={<RibbonButton>Plug-Ins</RibbonButton>}
            menuItems={[
              { label: 'Load Plugin A', onClick: loadPluginA },
              { label: 'Load Plugin B', onClick: loadPluginB },
            ]}
          />
        </Ribbon>

        {/* <button
          onClick={() => {
            importModeRef.current = "layer";
            fileInputRef.current?.click();
          }}
        >
          Trigger Import
        </button>

        <input type="file" accept=".json" onChange={handleFileChange} /> */}



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
              trackTransforms={trackTransforms}
              onDeleteLayer={handleDeleteLayer}
            />
          </RightContainer>

          <RightContainer>
            <Menu
              saveLayerState={saveLayerState}
              activeLayerName={activeLayer?.name}
              activeLayerType={activeLayer?.type}
              layerOps={layerOps}
              saveTrackTransforms={saveTrackTransforms}
            />
          </RightContainer>
        </Container>
      </Main>
    </SocketContext.Provider>
  );
}

const RibbonDropdown = ({ trigger, menuItems }) => {
  const [open, setOpen] = useState(false);

  const handleRibbonToggle = () => setOpen((prev) => !prev);

  return (
    <RibbonDropdownContainer
      tabIndex={0}
      onBlur={(e) => {
        setTimeout(() => setOpen(false), 100); // Wait so button click registers before closing out
      }}
    >
      <RibbonDropdownTrigger onClick={handleRibbonToggle}>
        {trigger}
      </RibbonDropdownTrigger>
      {open && (
        <RibbonDropdownMenu role="menu">
          {menuItems.map(({ label, onClick }, index) => (
            <DropdownItem key={index} role="menuitem">
              <button onClick={onClick}>{label}</button>
            </DropdownItem>
          ))}
        </RibbonDropdownMenu>
      )}
    </RibbonDropdownContainer>
  );
};


const LayerList = ({ data, activeLayer, setActiveLayer, layerOps, trackTransforms, onDeleteLayer }) => {
  const [toggleStates, setToggleStates] = useState({});

  // Initialize toggle states from actual visibility data
  useEffect(() => {
    if (data) {
      setToggleStates((prevStates) => {
        const updatedStates = { ...prevStates };
        data.forEach(layer => {
          const serverVisible = layer.visible !== false;
          const prevVisible = prevStates[layer.name];

          // Only update if the server state changed
          if (prevVisible !== serverVisible) {
            updatedStates[layer.name] = serverVisible;
          }
        });
        return updatedStates;
      });
    }
  }, [data]);

  const handleLayerToggle = async (layerName) => {
    const newVisible = !toggleStates[layerName]; // Flip current state

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

  console.log("trackTransforms in LayerList:", trackTransforms);

  return (
    <div>
      {data ? (
        data.map((layer, index) => (
          <div key={index} style={{ marginBottom: "1.5em"}}>
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

            <div style={{ position: 'relative', width: '100%' }}>
              <LayerDropdownMenu
                layerName={layer.name}
                transformDescriptions={trackTransforms[layer.name]}
              />

              <div style={{ position: 'absolute', top: 0, right: 0 }}>
                <button
                  onClick={() => handleLayerToggle(layer.name)}
                  style={{
                    backgroundColor: toggleStates[layer.name] ? '#4CAF50' : '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.3s, transform 0.2s',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    marginBottom: '1.5em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {toggleStates[layer.name] ? 'On' : 'Off'}
                </button>

                <button
                  onClick={() => onDeleteLayer(layer.name)}
                  style={{
                    backgroundColor: "#e53935",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "background-color 0.3s, transform 0.2s",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    marginLeft: "10px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <LoadingText>Loading...</LoadingText>
      )}
    </div>
  );
};

const LayerDropdownMenu = ({ layerName, transformDescriptions }) => {
  const [isOpen, setIsOpen] = useState(false);
  console.log("Descriptions for", layerName, transformDescriptions);
  return (
    <div>
      <ShowTransformsButton onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Hide' : 'Show Transforms'}
      </ShowTransformsButton>

      {/* {isOpen && (
        transformDescriptions && transformDescriptions.length > 0 ? (
          <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5em', marginTop: '0.5em', fontSize: '0.5em' }}>
            {transformDescriptions.map((desc, index) => (
              <li key={index} style={{ marginBottom: '0.5em' }}>
                {desc}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ marginBottom: '0.3em', paddingLeft: '1.5em', fontSize: '0.5em' }}>
            No transform descriptions saved for {layerName}
          </p>
        )
      )} */}

      {isOpen && (
        <div
          style={{
            maxHeight: "250px",
            overflowY: "auto",
            paddingRight: "0.5em",
            marginTop: "0.25em",
            mmarginBottom: "0.25em"
          }}
        >
          {transformDescriptions && transformDescriptions.length > 0 ? (
            <ol
              style={{
                listStyleType: "decimal",
                paddingLeft: "1.5em",
                marginTop: "0.5em",
                fontSize: "0.5em"
              }}
            >
              {transformDescriptions.map((desc, index) => (
                <li key={index} style={{ marginBottom: "0.5em" }}>
                  {desc}
                </li>
              ))}
            </ol>
          ) : (
            <p
              style={{
                marginBottom: "0.3em",
                paddingLeft: "1.5em",
                fontSize: "0.5em"
              }}
            >
              No transform descriptions saved for {layerName}
            </p>
          )}
        </div>
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

const RibbonDropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  outline: none;
`;

const RibbonDropdownTrigger = styled.div`
  cursor: pointer;
`;

const RibbonDropdownMenu = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  list-style: none;
  background-color: white;
  opacity: 1;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 0.3rem;
  padding: 0.5rem 0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  z-index: 999;
  width: max-content;
  white-space: nowrap;
`;

const DropdownItem = styled.li`
  padding: 0.5rem 1rem;

  button {
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-size: 0.9rem;
    cursor: pointer;

    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

const LayerTitle = styled.span`
font-size:0.8rem;
font-weight: bold;
`

const DashboardText = styled.h1`
margin-left: 20px;
`

const Ribbon = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: #f0f0f0;
  padding: 0 20px;
  border-radius: 5px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
`;

const RibbonButton = styled.button`
  background-color: transparent;
  color: #333;
  border: none;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: #e0e0e0;
    color: #000;
  }
`;

const Button = styled.button`
background-color: ${(props) => (props.selected) ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
color: ${(props) => (props.selected) ? 'white' : 'rgba(0, 0, 0, 0.9)'};
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

const ShowTransformsButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  background-color:rgb(212, 212, 212);
  transition: background-color 0.3s;

  &:hover {
    background-color:rgb(200, 200, 200);
  }

  &:focus {
    outline: none;
  }
`;

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
width: 30rem;
flex-direction: column;
/* border: 1px solid rgba(0, 0, 0, 0.6); */
border-radius: 5px;
font-size: 30px;
padding: 2rem 1rem 1rem 1rem;
/* box-shadow: -5px 0px 10px 5px rgba(0,0,0,0.1); */
overflow-y: auto;
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