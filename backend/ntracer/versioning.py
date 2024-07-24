from flask_socketio import SocketIO

from ntracer.helpers.tracing_data_helper import ActionType
from ntracer.ntracer_functions import NtracerFunctions
from ntracer.ntracer_state import NtracerState
from ntracer.state_injector import inject_state, inject_state_and_socketio
from ntracer.visualization.image import ImageFunctions
from ntracer.visualization.indicator import IndicatorFunctions


class Versioning:
    @staticmethod
    @inject_state
    def undo(state: NtracerState):
        # Reverse database changes
        for action in state.coords.roots.actions:
            print(action)
            if action.type == ActionType.ADD_NEURON:
                state.coords.cdn_helper.delete_neuron(action.neuron_id)
            elif action.type == ActionType.DELETE_NEURON:
                previous_state = state.coords.get_previous_state()
                neuron_swc = previous_state[action.neuron_id].to_swc()
                if neuron_swc is None:
                    raise Warning("Cannot load swc from neuron")
                
                neuron_swc = [line.strip().split() for line in neuron_swc.splitlines()]
                state.coords.cdn_helper.add_neuron(neuron_swc, action.neuron_id)
            elif action.type == ActionType.MODIFY_NEURON:
                previous_state = state.coords.get_previous_state()
                state.coords.cdn_helper.replace_neuron(
                    action.neuron_id, previous_state[action.neuron_id]
                )

        # Reverse internal tracing state
        state.coords.undo()

        # Deselect items
        state.dashboard_state.selected_indexes = []
        state.dashboard_state.selected_soma_z_slice = -1
        state.dashboard_state.selected_point = (-1, -1, -1)

        # Update viewer and dashboard
        IndicatorFunctions.clear_points()
        NtracerFunctions.set_selected_points()
        NtracerFunctions.request_fileserver_update()
        ImageFunctions.image_write()

    @staticmethod
    @inject_state
    def redo(state: NtracerState):
        coords = state.coords
        dashboard_state = state.dashboard_state
        coords.redo()

        # Redo database changes
        for action in coords.roots.actions:
            if action.type == ActionType.ADD_NEURON:
                neuron_swc = coords.roots[action.neuron_id].to_swc()
                if neuron_swc is None:
                    raise Warning("Cannot load swc from neuron")

                neuron_swc = [line.strip().split() for line in neuron_swc.splitlines()]
                state.coords.cdn_helper.add_neuron(neuron_swc, action.neuron_id)
            elif action.type == ActionType.DELETE_NEURON:
                state.coords.cdn_helper.delete_neuron(action.neuron_id)
            elif action.type == ActionType.MODIFY_NEURON:
                state.coords.cdn_helper.replace_neuron(
                    action.neuron_id, coords.roots[action.neuron_id]
                )

        # Deselect items
        dashboard_state.selected_indexes = []
        dashboard_state.selected_soma_z_slice = -1
        dashboard_state.selected_point = (-1, -1, -1)

        # Update viewer and dashboard
        NtracerFunctions.set_selected_points()
        ImageFunctions.image_write()
