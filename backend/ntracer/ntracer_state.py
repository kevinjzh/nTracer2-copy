import os
from dataclasses import dataclass

import requests
from neuroglancer import Viewer
from neuroglancer.viewer_config_state import ActionState

from cdn.cdn_array import CdnArray
from cdn.cdn_helper import CdnHelper
from ntracer.helpers.dashboard_state_helper import DashboardState
from ntracer.helpers.tracing_data_helper import Coords


@dataclass(init=True)
class NtracerState:
    coords: Coords
    viewer: Viewer

    dataset_id: str = os.environ["DATASET_ID"]
    precomputed_base: str = (
        f"{os.environ['PRECOMPUTED_URL']}/{os.environ['DATASET_ID']}"
    )
    precomputed_docker_base: str = (
        f"{os.environ['PRECOMPUTED_URL_DOCKER']}/{os.environ['DATASET_ID']}"
    )
    precomputed_annotation_base: str = f"{os.environ['PRECOMPUTED_ANNOTATION_URL']}/{os.environ['DATASET_ID']}"
    neuroglancer_port: int = 8083
    file_server_port: int = 8082

    is_multi: bool = False  # set on image load
    dashboard_state: DashboardState = DashboardState()
    selected_tracing_points: str | None = None
    startingPoint: tuple[int, int, int] | None = None
    endingPoint: tuple[int, int, int] | None = None
    endingPointS: ActionState | None = None
    currentAction: str | None = None

    def __init__(self):
        database_url = (
            f"{os.environ['DATABASE_URL']}/{os.environ['DATASET_ID']}/skeleton_api"
        )
        # Check if image is multi-channel
        self.is_multi = False
        (
            requests.get(f"{self.precomputed_docker_base[14:]}/info").json()[
                "num_channels"
            ]
            > 3
        )

        # Load Image
        cdn_helper = CdnHelper(database_url)
        cdn_array = CdnArray(
            drop_channel_dim=False if self.is_multi else True,
            url=f"{self.precomputed_docker_base[14:]}/",
        )
        scale = cdn_array.scales[0]["resolution"]
        layer_data = [cdn_array[i] for i in cdn_array.keys()]
        self.coords = Coords(
            cdn_array=cdn_array,
            cdn_helper=cdn_helper,
            scale=scale,
            layer_data=layer_data,
        )

        self.dashboard_state.scale = scale
        self.image: CdnArray.CdnResolutionItem = self.coords.layer_data[
            0
        ]  # highest resolution
