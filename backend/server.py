import dotenv
from sse_starlette import EventSourceResponse

from ntracer.helpers.dashboard_state_helper import DashboardState
from ntracer.helpers.ngauge_helper import NeuronHelper
dotenv.load_dotenv()

import json
import logging
import os
import webbrowser
import asyncio
from urllib.parse import quote_plus, urlparse
import posixpath
import requests

import neuroglancer.webdriver
from neuroglancer.viewer_state import ManagedLayer, ViewerState, Layer
from neuroglancer.viewer_config_state import ConfigState, ActionState
from neuroglancer import (
    Viewer,
    parse_url,
    to_url,
    ImageLayer,
    SegmentationLayer,
    SingleMeshLayer,
    AnnotationLayer,
    PointAnnotationLayer,
    LocalAnnotationLayer
)
#from flask import Flask, redirect, request, send_file, send_from_directory
#from flask_socketio import SocketIO
from ngauge import Neuron
from ntracer.helpers import swc_helper

from ntracer.ntracer_functions import NtracerFunctions
from ntracer.ntracer_state import NtracerState
from ntracer.state_injector import inject_state, get_state
from ntracer.tracing.deletion_functions import DeletionFunctions
from ntracer.tracing.tracing_functions import TracingFunctions
from ntracer.tracing.update_functions import UpdateFunctions
from ntracer.versioning import Versioning
from ntracer.visualization.image import ImageFunctions
from ntracer.visualization.indicator import IndicatorFunctions
from ntracer.visualization.freehand import FreehandFunctions
import os
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, Response, UploadFile, File, Form, HTTPException, Query
from fastapi_socketio import SocketManager
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("socketio")

app = FastAPI()

@app.get("/proxy")
async def proxy(url: str = Query(...)):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url) as resp:
            if resp.status_code != 200:
                return {"error": f"Failed to fetch {url}", "status": resp.status_code}
            
            return StreamingResponse(
                resp.aiter_bytes(),
                media_type=resp.headers.get("content-type", "application/octet-stream")
            )


ALLOWED_ORIGINS = [
    "http://localhost:8085",
    "http://localhost:3000",  # Frontend server
    "*",
]

sio = SocketManager(
    app=app,
    mount_location="/socket.io/",
    cors_allowed_origins=ALLOWED_ORIGINS,
    async_mode="asgi",
    ping_timeout=20,
    ping_interval=25,
    max_http_buffer_size=1e8,
    always_connect=True,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import FileResponse

@app.get("/debug-test")
async def debug_test():
    return FileResponse("/app/neuroglancer-dist/index.html")


app.mount("/dashboard", StaticFiles(directory="dashboard", html=True), name="static")
user_id = 0
TOKEN = "ntracer2"

def clear_points():
    FreehandFunctions.clear_points()
    IndicatorFunctions.clear_points()
    ImageFunctions.image_write()
    NtracerFunctions.set_selected_points()

@sio.on("connect")
async def connect(sid, environ, auth):
    logger.info(f"Client connected with sid: {sid}")
    client_origin = environ.get('HTTP_ORIGIN', 'Unknown origin')
    logger.info(f"Connection from origin: {client_origin}")
    
    try:
        await sio.emit('connection_established', {
            "status": "connected",
            "sid": sid,
            "origin": client_origin
        }, to=sid)
    except Exception as e:
        logger.error(f"Error in connect handler: {e}")

@sio.on("disconnect")
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

async def emit_layers_updated():
    await sio.emit('layers-updated')

@app.on_event("startup")
async def start_background_polling():
    logger.info("Starting background polling task")
    asyncio.create_task(poll_neuroglancer_state())

logger = logging.getLogger(__name__)

previous_layers = None
previous_position = [0, 0, 0]

'''
Unused
def extract_layer_metadata(state):
    # Return dict of layers
    layers = state.get("layers", [])
    result = {}

    for layer in layers:
        name = layer.get("name")
        if not name:
            continue
        result[name] = {
            "type": layer.get("type", "unknown"),
            "source": layer.get("source"),
            "visible": layer.get("visible", True),
        }

    return result
'''

async def poll_neuroglancer_state():
    global previous_layers, previous_position
    while True:
        try:
            # Get state as json
            state_json = neuroglancer.to_json_dump(get_state().viewer.state)

            # Parse to dict if needed
            state = json.loads(state_json) if isinstance(state_json, str) else state_json

            current_layers = state.get("layers", [])
            current_position = state.get("position", [])

            # Emit layers update if different
            if current_layers != previous_layers:
                previous_layers = current_layers
                await sio.emit('layers-updated')

            # Emit position update if different
            if current_position != previous_position:
                previous_position = current_position
                await sio.emit('position-updated', {'position': current_position})

        except Exception as e:
            logger.error(f"Polling error: {e}")
        
        await asyncio.sleep(0.5)

app.mount("/viewer", StaticFiles(directory="landing", html=True), name="viewer")

# Load NG locally
app.mount("/v", StaticFiles(directory="/app/neuroglancer-dist"), name="neuroglancer")

@app.get("/", response_model=None)
async def index() -> RedirectResponse:
    global user_id
    state = get_state()
    coords = state.coords
    dashboard_state = state.dashboard_state

    if state.viewer is None:
        if not hasattr(neuroglancer.AnnotationLayer, "annotation_color"):  # type: ignore
            from neuroglancer.viewer_state import optional, text_type, wrapped_property

            neuroglancer.AnnotationLayer.annotation_color = wrapped_property(  # type: ignore
                "annotationColor", optional(text_type)
            )

        # neuroglancer.set_server_bind_address(
        #     bind_address="0.0.0.0",  # Allow access from outside Docker container
        #     bind_port=state.neuroglancer_port,
        # )

        # runs image layer functions
        viewer = neuroglancer.Viewer()
        user_id+=1
        state.viewer = viewer
        ImageFunctions.image_init()
        await NtracerFunctions.download_from_database(state.coords)
        ImageFunctions.image_write()
        dashboard_state.channels = coords.shape[1]
        dashboard_state.selected_display_channels = list(
            range(dashboard_state.channels)
        )
        dashboard_state.selected_analysis_channels = list(
            range(dashboard_state.channels)
        )

        # Add these to html, hover for tip on how to use
        # defines all of the hot key commands
        viewer.actions.add("undo", lambda s: Versioning.undo())
        viewer.actions.add("redo", lambda s: Versioning.redo())
        viewer.actions.add("freehand draw", lambda s: NtracerFunctions.ctrl_keyf_left_click(s))
        viewer.actions.add("add point", lambda s: NtracerFunctions.ctrl_left_click(s))
        viewer.actions.add("add point no shift", lambda s: NtracerFunctions.ctrl_left_click(s, no_mean_shift=True))
        viewer.actions.add(
            "connect/commit points", lambda s: TracingFunctions.connect_or_commit_points()
        )
        viewer.actions.add(
            "connect/commit soma", lambda s: TracingFunctions.connect_or_commit_points(is_soma=True)
        )
        viewer.actions.add(
            "clear selections", lambda s: clear_points()
        )
        viewer.actions.add(
            "select branch", lambda s: NtracerFunctions.auto_select_branch(s)
        )
        viewer.actions.add(
            "select branch endpoint", lambda s: NtracerFunctions.auto_select_branch(s, get_endpoint=True)
        )
        viewer.actions.add(
            "complete soma", lambda s: complete_soma()
        )

        s: ConfigState
        with viewer.config_state.txn() as s:
            s.input_event_bindings.viewer["control+keyz"] = "undo"
            s.input_event_bindings.viewer["control+keyy"] = "redo"
            s.input_event_bindings.viewer["keyf"] = "freehand draw"
            s.input_event_bindings.data_view["control+mousedown0"] = "add point"
            s.input_event_bindings.data_view["alt+mousedown0"] = "add point no shift"
            s.input_event_bindings.data_view["keya"] = "connect/commit points"
            s.input_event_bindings.data_view["keys"] = "connect/commit soma"
            s.input_event_bindings.data_view["mousedown2"] = "clear selections"
            s.input_event_bindings.data_view["control+mousedown2"] = "clear selections"
            s.input_event_bindings.data_view["alt+mousedown2"] = "clear selections"
            s.input_event_bindings.data_view["alt+dblclick0"] = "select branch endpoint"
            s.input_event_bindings.data_view["keyo"] = "complete soma"

    # viewer_url = quote_plus(
    #     urlparse(posixpath.join(os.environ["PUBLIC_URL"], f"v/{TOKEN}/"))
    #     ._replace(netloc=f"{urlparse(os.environ['PUBLIC_URL']).hostname}:{state.neuroglancer_port}")
    #     .geturl()
    # )

    # viewer_url = "http://localhost:8050/v/"

    # # print(viewer_url)
    # dashboard_url = quote_plus("/dashboard")
    # return RedirectResponse(
    #     f"/viewer?viewer={viewer_url}&dashboard={dashboard_url}"
    # )
    
    # v2
    # viewer_url = "http://localhost:8050/v/index.html"
    # viewer_url = "http://localhost:8085/v/index.html"

    # dashboard_url = quote_plus("/dashboard")

    # return RedirectResponse(
    #     f"/viewer?viewer={quote_plus(viewer_url)}&dashboard={dashboard_url}"
    # )

    # v3
    viewer_url = "http://localhost:8085/v/index.html"
    dashboard_url = quote_plus("/dashboard")

    return RedirectResponse(
        f"/viewer?viewer={quote_plus(viewer_url)}&dashboard={dashboard_url}"
    )



@app.get("/viewer_state")
async def get_viewer_state():
    try:
        state = get_state()
        viewer = state.viewer if state else None

        if viewer is None:
            return JSONResponse({"error": "No viewer initialized yet"}, status_code=500)

        if viewer.state is None:
            return JSONResponse({"error": "Viewer state is not set yet"}, status_code=500)

        # Dump the entire current viewer state
        viewer_state_json = neuroglancer.to_json_dump(viewer.state)
        return json.loads(viewer_state_json)

    except Exception as e:
        print("❌ Error fetching viewer_state:", e)
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/layers")
def get_layers():
    try:
        # Get JSON string, then parse into dict
        viewer_state_json = neuroglancer.to_json_dump(get_state().viewer.state, indent=4)
        viewer_state = json.loads(viewer_state_json)

        layers = viewer_state.get('layers', [])
        extracted_info = []

        for layer in layers:
            name = layer.get('name', 'Unnamed')
            type = layer.get('type', 'Unknown type')
            visible = layer.get('visible', 'Unknown')

            num_channels = 1 # Default
            source = layer.get('source',{})

            if isinstance(source, dict):
                if 'numChannels' in source:
                    num_channels = source['numChannels']
                elif 'dimensions' in source and 'c^' in source['dimensions']:
                    dim_info = source['dimensions']['c^']
                    if isinstance(dim_info, dict) and 'scale' in dim_info:
                        # You might need to adjust this depending on your metadata
                        num_channels = dim_info.get('size', 1)

            extracted_info.append({
                'name': name,
                'type': type,
                'visible': visible,
                'num_channels': num_channels
            })
        
        # print("Layers: ", extracted_info)

        return extracted_info

    except Exception as e:
        print("Error retrieving layer info:", e)
        return {"error": str(e)}

def get_dashboard_state():
    return get_state().dashboard_state.get_state_dict()

def get_tracing_state():
    simple_object = {"children": []}
    state = get_state()
    for neuron_number, neuron in state.coords.roots.items():
        simple_object["children"].append(
            NeuronHelper.get_simple_neuron_object(neuron, neuron_number)
        )

    return simple_object

def get_points_state():
    res = get_state().selected_tracing_points
    if res is None:
        return []
    return res

def get_soma_state():
    return NtracerFunctions.get_soma_list()


@app.get("/stream/dashboard")
async def dashboard_stream(request: Request):
    async def event_generator():
        prev_state: str | None = None

        id = 0
        while True:
            # If client closes connection, stop sending events
            if await request.is_disconnected():
                break

            # Checks for new messages and return them to client if any
            dashboard_state = get_dashboard_state()
            tracing_state = get_tracing_state()
            points_state = get_points_state()
            soma_state = get_soma_state()

            res = json.dumps({
                "dashboard_state": dashboard_state,
                "tracing_state": tracing_state,
                "points_state": points_state,
                "soma_state": soma_state
            })

            if prev_state is None or res != prev_state:
                prev_state = res
                yield  {
                    "event": "state",
                    "retry": 15000,
                    "data": res,
                    "id": str(id)
                }

            id += 1
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator(), send_timeout=5)

@app.post("/dashboard_state/update")
async def dashboard_state_update(request: Request):
    data = await request.json()
    state = get_state()
    dashboard_state = state.dashboard_state
    (
        channels_have_changed,
        projection_range_has_changed,
        expanded_neuron_has_changed,
    ) = (False, False, False)
    if (
        data["selected_display_channels"]
        != dashboard_state.selected_display_channels
    ):
        channels_have_changed = True
    if data["projection_range"] != dashboard_state.projection_range:
        projection_range_has_changed = True
    if data["expanded_neuron"] != dashboard_state.expanded_neuron:
        expanded_neuron_has_changed = True
    if (
        "selected_point" in data
        and data["selected_point"] != (-1, -1, -1)
        and (
            not dashboard_state.is_point_selected
            or data["selected_point"] != dashboard_state.selected_point
        )
    ):
        NtracerFunctions.change_coordinate_on_select(
            data["selected_point"], state.coords.scale
        )

    for key in data:
        if hasattr(dashboard_state, key):
            setattr(dashboard_state, key, data[key])

    ImageFunctions.image_write()
    NtracerFunctions.set_selected_points()
    if channels_have_changed:
        NtracerFunctions.set_display_channels()

    if projection_range_has_changed:
        NtracerFunctions.set_projection_range()

    if expanded_neuron_has_changed and dashboard_state.expanded_neuron != -1:
        neuron = await state.coords.cdn_helper.get_swc(dashboard_state.expanded_neuron, True)
        if not isinstance(neuron, Neuron):
            raise TypeError("Cannot retrieve swc as Neuron object")

        state.coords.roots[dashboard_state.expanded_neuron] = neuron
        state.coords.downloaded_neurons.append(dashboard_state.expanded_neuron)
        # NtracerFunctions.set_selected_points()


@app.get("/neuron/delete")
def delete_neuron():
    state = get_state()
    dashboard_state = state.dashboard_state
    neuron_index = dashboard_state.selected_neuron_id

    if len(dashboard_state.selected_indexes) == 0:
        print("No neuron selected")
        return

    DeletionFunctions.delete_neuron(neuron_index)


@app.get("/branch/delete")
def delete_branch():
    state = get_state()
    dashboard_state = state.dashboard_state
    branch_indexes = dashboard_state.selected_branch_indexes
    neuron_id = dashboard_state.selected_neuron_id

    # Only neuron specified, return
    if (
        not dashboard_state.is_neuron_selected
        or branch_indexes is None
        or len(branch_indexes) < 1
    ):
        print("No branch selected")
        return

    DeletionFunctions.delete_branch(neuron_id, branch_indexes)


@app.get("/point/delete")
def delete_point():
    state = get_state()
    dashboard_state = state.dashboard_state
    neuron_id = dashboard_state.selected_neuron_id
    branch_indexes = dashboard_state.selected_branch_indexes
    if dashboard_state.selected_point is None:
        raise Warning("No point selected")

    DeletionFunctions.delete_point(
        neuron_id, branch_indexes, dashboard_state.selected_point
    )

@app.get("/soma/delete")
def delete_soma():
    state = get_state()
    dashboard_state = state.dashboard_state
    neuron_id = dashboard_state.selected_neuron_id
    selected_soma_z_slice = dashboard_state.selected_soma_z_slice
    DeletionFunctions.delete_soma(neuron_id, selected_soma_z_slice)

@app.get("/neuron/combine")
def combine_neurons():
    state = get_state()
    dashboard_state = state.dashboard_state
    neuron_ids = [s[0] for s in dashboard_state.selected_indexes]
    if len(neuron_ids) != len(set(neuron_ids)):
        return
    UpdateFunctions.combine_neurons(neuron_ids)
    dashboard_state.selected_indexes = []
    dashboard_state.selected_point = None

@app.get("/branch/break")
def break_branch():
    state = get_state()
    dashboard_state = state.dashboard_state

    if not dashboard_state.is_branch_selected:
        return

    neuron_id = dashboard_state.selected_neuron_id
    selected_branch_indexes = dashboard_state.selected_branch_indexes
    selected_point = dashboard_state.selected_point

    if selected_point is None:
        raise Warning("No point selected")

    UpdateFunctions.branch_break(
        neuron_id, selected_branch_indexes, selected_point
    )


@app.get("/soma/complete")
def complete_soma():
    state = get_state()
    dashboard_state = state.dashboard_state
    neuron_id = dashboard_state.selected_neuron_id

    if (
        dashboard_state.selected_soma_z_slice == -1
        or len(dashboard_state.selected_indexes) == 0
    ):
        print("No soma selected")
        return

    selected_soma_z_slice = dashboard_state.selected_soma_z_slice
    TracingFunctions.complete_soma(neuron_id, selected_soma_z_slice)


@app.get("/branch/set_primary")
def set_primary_branch():
    state = get_state()
    dashboard_state = state.dashboard_state
    neuron_id = dashboard_state.selected_neuron_id
    selected_branch_indexes = dashboard_state.selected_branch_indexes
    UpdateFunctions.set_primary_branch(neuron_id, selected_branch_indexes)

@app.get("/branch/join")
def join_branches():
    state = get_state()
    dashboard_state = state.dashboard_state
    if len(dashboard_state.selected_indexes) != 2:  # Must have 2 branch selected
        return

    indexes1 = dashboard_state.selected_indexes[0][1:]
    indexes2 = dashboard_state.selected_indexes[1][1:]
    neuron_id1 = dashboard_state.selected_indexes[0][0]
    neuron_id2 = dashboard_state.selected_indexes[1][0]
    UpdateFunctions.join_branches(neuron_id1, neuron_id2, indexes1, indexes2)


@app.get("/swc/export")
async def export_swc(selected: bool):
    state = get_state()
    if selected:
        neuron_ids = [s[0] for s in state.dashboard_state.selected_indexes]
        print("exporting selected", neuron_ids)
    else:
        neuron_ids = list(state.coords.roots.keys())

    awaits = []

    for neuron_id in neuron_ids:
        if neuron_id not in state.coords.downloaded_neurons:
            awaits.append((state.coords.cdn_helper.get_swc(neuron_id, True), neuron_id))

    for (awaitable, neuron_id) in awaits:
        new_neuron = await awaitable
        if type(new_neuron) is Neuron:
            state.coords.roots[neuron_id] = new_neuron
            state.coords.downloaded_neurons.append(neuron_id)
    
    out_bin = swc_helper.export_swc(neuron_ids)
    filename = f"{state.dataset_id}_swc.zip"
    return Response(content=out_bin.getvalue(), media_type=
                    'application/zip', headers={'Content-Disposition': f'attachment; filename="{filename}"'})


@app.get("/trace/neurite")
def trace_neurite():
    TracingFunctions.connect_selected_points()


@app.get("/trace/soma")
def trace_soma():
    TracingFunctions.connect_selected_points(is_soma=True)


@app.post("/swc/import")
async def import_swc(request: Request):
    data = await request.body()
    swc_helper.import_swc(data)

@app.get("/dashboard/")
def dashboard():
    return send_file("dashboard/build/index.html")

@app.get("/static/js/<path:filename>")
def static_js_files(filename):
    return send_from_directory("dashboard/build/static/js", filename)

@app.get("/static/css/<path:filename>")
def static_css_files(filename):
    return send_from_directory("dashboard/build/static/css", filename)

'''
@app.get("/state")
def get_state():
    return get_dashboard_state()
'''

'''
@app.post("/update_origin")
async def update_origin(request: Request):
    current_viewer = get_state().viewer
    try:
        layerName, matrix = await request.json()
        with current_viewer.txn() as s:
                for layer in s.layers:
                    if layer.name == layerName:
                        oldOrigin = layer.
    except Exception as e:
        print("Error updating origin: ", e)
'''

# @app.post("/transform")
# async def transform(request: Request):
#     try:
#         m, layerName = await request.json()
        

#         # print("data from fetch request: ", data)
#         # matrix_json = json.dumps(transform_matrix)

#         #viewer = neuroglancer.Viewer(token=TOKEN)
#         #viewerState = viewer.state
#         #print("ViewerState extracted: ", viewerState)
#         #pretransform_url = neuroglancer.to_url(viewerState, "https://sonic2.cai-lab.org/neuroglancer/")
#         #pretransform_url = viewer.get_viewer_url()
#         #print("Pretransform url: ", pretransform_url)
#         #print("to_json: ", viewer.state.to_json())
        
#         #json = neuroglancer.to_json_dump(viewerState)
#         #print("JSON: ", json)

#         #parsed_url = neuroglancer.parse_url(pretransform_url)

        
#         # if 'layers' in pretransform_state:
#         #     print("if statement")
#         #     pretransform_state["layers"][0]["source"]["transform"]["matrix"] = transformation_matrix
#         # else:
#         #     print("No layers")

#         current_viewer = get_state().viewer
        

#         # print("Class: ", current_viewer.__class__) # current_viewer is <class 'neuroglancer.viewer.Viewer'>
#         print("State: ", neuroglancer.to_json_dump(current_viewer.state, indent=4), "END STATE")

#         try:
#             with current_viewer.txn() as s:
#                 for layer in s.layers:
#                     if layer.name == layerName:
#                         # # Create CoordinateSpaceTransform with existing global dimensions
#                         # transform = neuroglancer.CoordinateSpaceTransform(
#                         #     output_dimensions=s.dimensions,
#                         #     matrix=m
#                         # )

#                         # # Apply the transform to the layer's data source
#                         # try:
#                         #     for source in layer.sources:
#                         #         source.transform = transform
#                         #     print(f"Updated transform for layer: {layerName}")
#                         # except Exception as e:
#                         #     print(f"Failed to set transform for {layerName}: {e}")
#                         # break

#                         dimensions = neuroglancer.CoordinateSpace(
#                             names=s.dimensions.names, units=s.dimensions.units, scales=s.dimensions.scales
#                         )

#                         layer.source[0].transform = neuroglancer.CoordinateSpaceTransform(
#                             output_dimensions=dimensions,
#                             matrix=m
#                         )
#             print("Current viewer: ", current_viewer, "END VIEWER")

#         except Exception as e:
#             print("Error updating matrix: ", {e})

#     except Exception as e:
#         print("ERROR: ", {e})

@app.post("/transform")
async def transform(request: Request):
    try:
        payload = await request.json()
        m = payload.get("matrix")
        layer_name = payload.get("layerName")

        if m is None or layer_name is None:
            return {"error": "Missing required fields: 'matrix' or 'layerName'"}

        m = [[float(v) for v in row] for row in m]

        current_viewer = get_state().viewer
        if not current_viewer:
            return {"error": "No Neuroglancer viewer initialized"}

        with current_viewer.txn() as s:
            layer_found = False
            for layer in s.layers:
                if layer.name == layer_name:
                    layer_found = True

                    dimensions = neuroglancer.CoordinateSpace(
                        names=s.dimensions.names,
                        units=s.dimensions.units,
                        scales=s.dimensions.scales
                    )

                    layer.source[0].transform = neuroglancer.CoordinateSpaceTransform(
                        output_dimensions=dimensions,
                        matrix=m
                    )

                    break

        print("Current viewer: ", current_viewer, "END VIEWER")

        if not layer_found:
            return {"error": f"Layer '{layer_name}' not found"}

        updated_state_json = neuroglancer.to_json_dump(current_viewer.state)
        updated_state_dict = json.loads(updated_state_json)

        await sio.emit("viewer-state-updated", updated_state_dict)
        # print("Emitted live viewer-state-updated to all clients")

        return {
            "status": "success",
            "message": f"Transform applied to {layer_name}",
            "updated_layers": len(updated_state_dict.get("layers", []))
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to apply transform: {str(e)}"}



@app.post("/toggle_visibility")
async def toggle_visibility(request: Request):
    payload = await request.json()
    layer_name = payload.get("layerName")
    visible = payload.get("visible")

    viewer = get_state().viewer

    with viewer.txn() as txn:
        for i, layer in enumerate(txn.layers):
            if layer.name == layer_name:
                # Convert to JSON, change fields to None to reconstruct
                layer_json = json.loads(neuroglancer.to_json_dump(layer))
                layer_type = layer_json.pop("type", None)
                layer_json.pop("name", None)
                layer_json.pop("visible", None)

                # Reconstruct new layer object
                if layer_type == "image":
                    new_layer = ImageLayer(**layer_json) # Python dictionary unpacking, simply the structure of layer_json
                elif layer_type == "segmentation":
                    new_layer = SegmentationLayer(**layer_json)
                elif layer_type == "mesh":
                    new_layer = SingleMeshLayer(**layer_json)
                elif layer_type == "annotation":
                    try:
                        new_layer = PointAnnotationLayer(**layer_json)
                    except Exception:
                        try:
                            new_layer = LocalAnnotationLayer(**layer_json)
                        except Exception:
                            new_layer = AnnotationLayer(**layer_json)
                else:
                    raise ValueError(f"Unsupported layer type: {layer_type}")

                # Remove old layer by name
                del txn.layers[layer_name]

                # Re-add new layer with visibility
                txn.layers[layer_name] = new_layer
                txn.layers[layer_name].visible = visible
                break

    return {"status": "success", "visible": visible}

@app.post("/set_origin")
async def set_origin(request: Request):
    try:
        m = await request.json()
        current_viewer = get_state().viewer
        viewer_state_json = neuroglancer.to_json_dump(get_state().viewer.state, indent=4)
        viewer_state = json.loads(viewer_state_json)

        current_origin = viewer_state.get('position')
        homogenous_origin = np.array(current_origin + [1.0])
        homogenous_matrix = np.array(m)
        transformed_origin = homogenous_matrix @ homogenous_origin

        # with current_viewer.txn() as s:
        #     s.position = transformed_origin[:3].tolist()
    
    except Exception as e:
        return {"Error setting origin": str(e)}
    
@app.post("/set_origin_button") # Print local position and dimension
async def set_origin(request: Request):
    try:
        data = await request.json()
        layer_name = data.get("layerName")
        if not layer_name:
            return {"error": "Missing layerName"}

        viewer = get_state().viewer

        with viewer.txn() as s:
            if layer_name in s.layers:
                layer = s.layers[layer_name]
                print(f"Local position for layer '{layer_name}':", layer.local_position)
                try:
                    print(f"Local dimension:", layer.local_dimensions)
                except Exception as e:
                    print(f"Error accessing local_dimensions: {e}")

                return {"local_position": layer.local_position.tolist() if layer.local_position is not None else None}
            else:
                return {"error": f"Layer '{layer_name}' not found"}
    
    except Exception as e:
        return {"error": str(e)}

    # try:
    #     current_viewer = get_state().viewer
    #     viewer_state_json = neuroglancer.to_json_dump(get_state().viewer.state, indent=4)
    #     viewer_state = json.loads(viewer_state_json)

    #     current_origin = viewer_state.get('position')

    #     with current_viewer.txn() as s:
    #         s.position = current_origin.tolist()
    
    # except Exception as e:
    #     return {"Error setting origin": str(e)}

@app.post("/reset_origin")
async def reset_origin():
    current_viewer = get_state().viewer
    with current_viewer.txn() as s:
        s.position = [0.5, 0.5, 0.5]
    return {"status": "origin reset"}

@app.post("/delete_layer")
async def delete_layer(request: Request):
    try:
        data = await request.json()
        layer_name = data.get("layerName")
        if not layer_name:
            return {"error": "Missing layerName"}

        viewer = get_state().viewer

        with viewer.txn() as txn:
            if layer_name not in txn.layers:
                return {"error": f"Layer '{layer_name}' not found"}

            del txn.layers[layer_name]

        return {"status": "success", "deleted": layer_name}

    except Exception as e:
        return {"error": str(e)}
    
@app.post("/import_layer")
async def upload_layer(file: UploadFile = File(...), layer_name: str = Form(...)):
    try:
        contents = await file.read()
        data = json.loads(contents.decode("utf-8"))

        if data.get("type") != "image":
            raise HTTPException(status_code=400, detail="Only 'image' layers are supported.")

        # Remove fields that conflict with constructor
        data.pop("type", None)
        data.pop("name", None)  # Don't pass it as a constructor arg

        # Create layer object without name
        layer_obj = ImageLayer(**data)

        # Now set the name separately
        layer_obj.name = layer_name

        # Append to viewer
        viewer = get_state().viewer
        with viewer.txn() as s:
            s.layers.append(layer_obj)

        return {
            "message": f"Layer '{layer_name}' added successfully.",
            "url": viewer.get_viewer_url()
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Layer import failed: {e}")
    
    # try:
    #     contents = await file.read()
    #     data = json.loads(contents.decode("utf-8"))
    #     if "type" not in data:
    #         raise HTTPException(400, "Uploaded layer missing 'type' field.")
        
    #     # Update view state with new layer
    #     viewer = get_state().viewer
    #     with viewer.txn() as s:
    #         layer_obj = Layer(**data)
    #         s.layers[layer_name] = data
    #     return {"message": f"Layer '{layer_name}' added", "url": viewer.get_viewer_url()}
    
    # except Exception as e:
    #     print("Layer import error: ", e)
    #     raise HTTPException(status_code=500, detail=f"Layer import failed: {e}")


# @app.post("/import_viewer")
# async def upload_viewer_state(file: UploadFile = File(...)):
#     try:
#         contents = await file.read()
#         data = json.loads(contents.decode("utf-8"))
#         if "layers" not in data:
#             raise HTTPException(400, "Uploaded viewer state missing 'layers' field.")
        
#         viewer = get_state().viewer
        
#         viewer.set_state(ViewerState(json_data=data))
        
#         # Broadcast new viewer state to all clients
#         updated_state_json = neuroglancer.to_json_dump(viewer.state)
#         updated_state_dict = json.loads(updated_state_json)
#         await sio.emit("viewer-state-updated", updated_state_dict)
#         print("📡 Emitted viewer-state-updated after import")

#         return {
#             "message": "Viewer state loaded",
#             "url": viewer.get_viewer_url()
#         }
#     except Exception as e:
#         print("Viewer state import error: ", e)
#         raise HTTPException(status_code=500, detail=f"Viewer import failed: {e}")

@app.post("/import_viewer")
async def upload_viewer_state(data: dict):  # Accept dict directly
    try:
        if "layers" not in data:
            raise HTTPException(400, "Uploaded viewer state missing 'layers' field.")
                 
        viewer = get_state().viewer
        viewer.set_state(ViewerState(json_data=data))
                 
        # Broadcast new viewer state to all clients
        updated_state_json = neuroglancer.to_json_dump(viewer.state)
        updated_state_dict = json.loads(updated_state_json)
        await sio.emit("viewer-state-updated", updated_state_dict)
        print("Emitted viewer-state-updated after import")
         
        return {
            "message": "Viewer state loaded",
            "url": viewer.get_viewer_url()
        }
    except Exception as e:
        print("Viewer state import error: ", e)
        raise HTTPException(status_code=500, detail=f"Viewer import failed: {e}")


@app.post("/update_image_rendering")
async def update_image_rendering(request: Request):
    data = await request.json()
    layer_name = data["layerName"]
    opacity = float(data["opacity"])
    shader = data["shader"]
    shader_controls = data.get("shaderControls", {})
    viewer = get_state().viewer

    with viewer.txn() as s:
        s.layers[layer_name] = neuroglancer.ImageLayer(
            source=s.layers[layer_name].source,
            opacity=opacity,
            shader=shader,
            shader_controls=shader_controls
        )
    return { "status": "success" }

@app.post("/update_segment_rendering")
async def update_segment_rendering(request: Request):
    data = await request.json()
    layer_name = data["layerName"]
    opacity = float(data["opacity"])
    saturation = float(data["saturation"])
    viewer = get_state().viewer

    with viewer.txn() as s:
        s.layers[layer_name] = neuroglancer.SegmentationLayer(
            source=s.layers[layer_name].source,
            opacity=opacity,
            saturation=saturation
        )
    return {"status": "success"}
