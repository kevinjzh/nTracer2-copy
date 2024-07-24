from __future__ import annotations

from collections import namedtuple
from typing import TYPE_CHECKING, Optional

from ngauge import Neuron
from ngauge.TracingPoint import TracingPoint

from algorithm.astar.tracing import get_trace as astar  # pylint: disable=all
from ntracer.state_injector import inject_state

if TYPE_CHECKING:
    from ntracer.ntracer_state import NtracerState


class NeuronHelper:
    """Helper functions for nGauge's Neuron objects"""

    @staticmethod
    def pixels_to_physical(
        xs: tuple[int, int, int], scale: tuple[float, float, float]
    ) -> tuple[float, float, float]:
        scale_factor = [1000 / scale[i] for i in range(len(scale))]
        return tuple((xs[i] / scale_factor[i] for i in range(len(xs))))

    @staticmethod
    def physical_to_pixels(
        xs: tuple[float, float, float], scale: tuple[float, float, float]
    ) -> tuple[int, int, int]:
        scale_factor = [1000 / scale[i] for i in range(len(scale))]
        return tuple(map(int, (xs[i] * scale_factor[i] for i in range(len(xs)))))

    @staticmethod
    def get_simple_neuron_object(neuron: Neuron, neuron_number: int) -> dict:
        """Return a neuron as a simple object"""
        neuron_data = {
            "key": neuron_number,
            "children": [],
        }
        for branch_number, branch in enumerate(neuron.branches):
            neuron_data["children"].append(
                TracingPointHelper._get_simple_node_object(
                    branch, str(neuron_number) + "-" + str(branch_number)
                )
            )
        return neuron_data

    @staticmethod
    def get_simple_neuron_soma(neuron: Neuron, z_slice: int) -> list[dict]:
        soma_nodes = neuron.soma_layers[z_slice]
        return [
            {"x": node.x, "y": node.y, "z": node.z, "r": node.r, "type": "Soma"}
            for node in soma_nodes
        ]

    @staticmethod
    def delete_soma(neuron: Neuron, z_slices: Optional[list[int]] = None):
        if z_slices is None:
            z_slices = list(neuron.soma_layers.keys())

        for z_slice in z_slices:
            neuron.soma_layers.pop(z_slice)

    @staticmethod
    def delete_child_branch(neuron: Neuron, branch_index: int):
        """Delete branch of neuron"""
        neuron.branches.pop(branch_index)

    @staticmethod
    def get_child_branch(neuron: Neuron, index: int) -> TracingPoint:
        """Returns child branch of neuron"""
        return neuron.branches[index]

    @staticmethod
    def move_to_branches(neuron: Neuron, indexes: list[int]) -> TracingPoint:
        """Returns child branch after traversing through the branch indexes"""
        if len(indexes) == 0:
            raise Exception("Indexes cannot be empty")

        child_branch = NeuronHelper.get_child_branch(neuron, indexes[0])
        current = child_branch
        for index in indexes[1:]:
            current = TracingPointHelper.move_to_branch(current, index)
        return current

    @staticmethod
    def set_primary_branch(neuron: Neuron, indexes: list[int]):
        if len(indexes) == 0:
            return neuron

        new_main_branch = NeuronHelper.move_to_branches(neuron, indexes)

        new_root = new_main_branch
        while len(new_root.children) > 0:  # Get last point of new branch
            new_root = new_root.children[0]

        root_index = indexes[0]
        DetailedTP = namedtuple("DetailedTP", ["TP", "adj"])
        start_point = NeuronHelper.get_child_branch(neuron, root_index)
        point_stack = [DetailedTP(start_point, start_point.children)]
        detailed_root_point = None
        detailed_point_dict = {point_stack[0].TP: point_stack[0]}

        while len(point_stack) > 0:
            curr = point_stack.pop()
            detailed_point_dict[curr.TP] = curr

            if curr.TP is new_root:
                detailed_root_point = curr

            for child in curr.TP.children:
                point_stack.append(DetailedTP(child, [curr.TP] + child.children))

        if detailed_root_point is None:
            print("Cannot find root point")
            return

        point_stack.clear()
        point_stack.append(DetailedTP(detailed_root_point, None))
        added = set()
        added.add(detailed_root_point.TP)

        while len(point_stack) > 0:
            curr, parent = point_stack.pop()

            new_children = []
            for c in curr.adj:
                if c not in added:
                    new_children.append(c)
                    added.add(c)

            curr.TP.children = new_children
            curr.TP.parent = parent
            for c in new_children:
                point_stack.append(DetailedTP(detailed_point_dict[c], curr.TP))

        neuron.branches[root_index] = detailed_root_point.TP

    @staticmethod
    @inject_state
    def join_branches(
        state: NtracerState,
        neuron1: Neuron,
        neuron2: Neuron,
        indexes1: list[int],
        indexes2: list[int],
    ):
        coords = state.coords

        branch1 = NeuronHelper.move_to_branches(neuron1, indexes1)
        terminal1 = TracingPointHelper.move_to_last_branch_point(branch1)
        if len(indexes2) > 1:  # second branch is not primary branch of neuron
            NeuronHelper.set_primary_branch(neuron2, indexes2)
            terminal2 = NeuronHelper.move_to_branches(neuron2, [0])  # primary branch
        else:
            terminal2 = NeuronHelper.move_to_branches(neuron2, indexes2)

        new_path = astar(
            coords,
            NeuronHelper.physical_to_pixels(
                (terminal1.x, terminal1.y, terminal1.z), coords.scale
            ),
            NeuronHelper.physical_to_pixels(
                (terminal2.x, terminal2.y, terminal2.z), coords.scale
            ),
            state.is_multi,
        )[1:-1]
        new_path = [
            NeuronHelper.pixels_to_physical(xs, coords.scale) for xs in new_path
        ]

        tps = (
            [terminal1]
            + [TracingPoint(p[0], p[1], p[2], coords.radius, 2) for p in new_path]
            + [terminal2]
        )

        for i, tp in enumerate(tps[:-1]):
            tp.children.append(tps[i + 1])

    @staticmethod
    def get_branch_indexes_from_point(neuron: Neuron, point: tuple[int, int, int]):
        for i, branch in enumerate(neuron.branches):
            found = TracingPointHelper.get_branch_indexes_of_point(
                branch, point, curr_indexes=[i]
            )
            if found is not None:
                return found


class TracingPointHelper:
    """Helper functions for nGauge's TracingPoint objects"""

    @staticmethod
    def get_branch_points(node: TracingPoint) -> list[TracingPoint]:
        """get all TracingPoint of branch"""
        if len(node.children) != 1:
            return [node]

        return [node] + TracingPointHelper.get_branch_points(node.children[0])

    @staticmethod
    def delete_child_branch(parent_node: TracingPoint, branch_index: int):
        """Delete branch of node"""
        current = parent_node
        while len(current.children) == 1:
            current = current.children[0]
        current.children.pop(branch_index)

    @staticmethod
    def move_to_branch(node: TracingPoint, index: int) -> TracingPoint:
        """Returns child branch given by index"""
        current = node
        while len(current.children) == 1:  # Move to branching point
            current = current.children[0]
        return current.children[index]

    @staticmethod
    def move_to_branches(node: TracingPoint, indexes: list[int]) -> TracingPoint:
        """Returns child branch after traversing through the branch indexes"""
        current = node
        for index in indexes:
            current = TracingPointHelper.move_to_branch(current, index)
        return current

    @staticmethod
    def move_to_point(
        node: TracingPoint, point: tuple[int, int, int]
    ) -> Optional[TracingPoint]:
        """Returns TracingPoint in current branch"""
        x, y, z = point
        while (node.x != x or node.y != y or node.z != z) and len(node.children) == 1:
            node = node.children[0]
        if node.x == x and node.y == y and node.z == z:
            return node
        else:
            return None

    @staticmethod
    def get_branch_indexes_of_point(
        node: TracingPoint,
        point: tuple[int, int, int],
        curr_indexes: list[int] | None = None,
    ) -> Optional[list[int]]:
        """Returns branch indexes of a point"""
        if curr_indexes is None:
            curr_indexes = []

        x, y, z = point
        while node:
            if node.x == x and node.y == y and node.z == z:
                return curr_indexes
            if len(node.children) == 0:
                return None
            elif len(node.children) == 1:
                node = node.children[0]
            else:
                for i, child in enumerate(node.children):
                    found = TracingPointHelper.get_branch_indexes_of_point(
                        child, point, curr_indexes=curr_indexes + [i]
                    )
                    if found is not None:
                        return found
                return None

    @staticmethod
    def move_to_last_branch_point(node: TracingPoint) -> TracingPoint:
        while len(node.children) == 1:
            node = node.children[0]
        return node

    @staticmethod
    def delete_point(
        node: TracingPoint, target: tuple[int, int, int]
    ) -> TracingPoint | list[TracingPoint]:
        """Remove a point from a branch and return resultant branch(es)"""
        x, y, z = target
        current = node
        if (
            current.x == x and current.y == y and current.z == z
        ):  # First point is target
            for child in current.children:
                child.parent = None

            if len(current.children) == 1:
                return current.children[0]
            else:
                return current.children

        while len(current.children) == 1:
            next_node = current.children[0]
            if next_node.x == x and next_node.y == y and next_node.z == z:
                next_node.parent = current
                break
            else:
                current = next_node

        if len(current.children[0].children) == 0:
            current.children.pop(0)
        else:
            for child in current.children[0].children:
                child.parent = current
            for child in current.children[1:]:
                child.parent = current

            current.children = current.children[0].children + current.children[1:]

        return node

    @staticmethod
    def _get_simple_node_object(node: TracingPoint, node_key: str) -> dict:
        """Internal: return node as a simple object"""
        ret = {"key": node_key, "children": []}
        while len(node.children) == 1:
            node = node.children[0]
        if len(node.children) > 1:
            for branch_number, child in enumerate(node.children):
                ret["children"].append(
                    TracingPointHelper._get_simple_node_object(
                        child, node_key + "-" + str(branch_number)
                    )
                )
        return ret

    @staticmethod
    def get_simple_branch_points(node: TracingPoint) -> list[dict]:
        ret = []
        while node is not None:
            ret.append(
                {"x": node.x, "y": node.y, "z": node.z, "r": node.r, "type": "Neurite"}
            )
            if len(node.children) == 1:
                node = node.children[0]
            else:
                break
        return ret
