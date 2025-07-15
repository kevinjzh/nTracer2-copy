from ntracer.ntracer_functions import NtracerFunctions
from ntracer.ntracer_state import NtracerState
from ntracer.state_injector import inject_state
from ntracer.utils.timing import print_time
from ngauge import Neuron
import zipfile
import io

from ntracer.visualization.image import ImageFunctions


def import_swc(swc: bytes, neuron_id: int | None = None):
    """Import a SWC file from input bytes.

    Args:
        swc_str: SWC bytes to import.
        neuron_id (int, optional): Neuron id to import to. Defaults to None.

    Returns:
        void
    """

    swc_str = swc.decode("utf-8")

    neuron = Neuron.from_swc_text(swc_str.split("\n"))
    NtracerFunctions.add_new_neuron(neuron, neuron_id)
    ImageFunctions.image_write()
    NtracerFunctions.set_selected_points()


@inject_state
def export_swc(state: NtracerState, neuron_ids: list[int]) -> io.BytesIO:
    """Export multiple neurons to a zipped folder of SWC files.

    Args:
        neuron_ids (list[int]): neuron ids to export

    Returns:
        BytesIO object representing the zipped folder
    """

    zip_io = io.BytesIO()
    
    with zipfile.ZipFile(zip_io, "w") as zip_f:
        for neuron_id in neuron_ids:
            neuron = state.coords.roots[neuron_id]
            out = neuron.to_swc()
            if out is None:
                print(f"Neuron {neuron_id} cannot be exported to SWC")
            else:
                zip_f.writestr(f"{state.dataset_id}_{neuron_id}.swc", out)
    
    return zip_io

