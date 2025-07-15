from collections import UserDict

from ngauge import Neuron, TracingPoint


class NeuronDict(UserDict[int, Neuron]):
    def __copy_tp(self, root: TracingPoint):
        stack = [root]
        points = {}
        while len(stack) > 0:
            curr = stack.pop()
            new_tp = TracingPoint(
                curr.x, curr.y, curr.z, curr.r, curr.t, None, curr.file_id, None
            )
            points[id(curr)] = new_tp
            for c in curr.children:
                stack.append(c)
        stack = [root]
        while len(stack) > 0:
            curr = stack.pop()
            new_node = points[id(curr)]
            new_node.children = [points[id(c)] for c in curr.children]
            if curr.parent:
                new_node.parent = points[id(curr.parent)]
            for c in curr.children:
                stack.append(c)
        return points[id(root)]

    def __deepcopy__(self, memo):
        result = NeuronDict()
        for key, item in self.items():
            new_neuron = Neuron()
            new_neuron.metadata = item.metadata
            new_neuron.branches = [self.__copy_tp(root) for root in item.branches]
            for points in item.soma_layers.values():
                new_neuron.add_soma_points([(p.x, p.y, p.z, p.z) for p in points])
            result[key] = new_neuron

        memo[id(self)] = result
        return result
