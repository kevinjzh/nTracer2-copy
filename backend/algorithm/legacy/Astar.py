# distutils: language=c++
import cython
from algorithm.legacy.tracing_utils import smoothen_path, PriorityQueue


class Astar:
    def __init__(self, start, end, coords, is_soma=False, xy_extension=21, z_extension=7, res=0, limit=1000000):
        if not cython.compiled:
            print("Not using Cython")
        start = list(start)
        end = list(end)

        for i in range(len(start)):
            start[i] = start[i] // (2 ** res)
            end[i] = end[i] // (2 ** res)
        self.start, self.end = tuple(start), tuple(end)
        self.limit = limit
        self.res = res

        minX0, minX1, minX2 = min(start[0], end[0]), min(start[1], end[1]), min(start[2], end[2])
        self.maxX0, self.maxX1, self.maxX2 = max(start[0], end[0]), max(start[1], end[1]), max(start[2], end[2])
        self.offsets = (max(minX0 - xy_extension, 0), max(minX1 - xy_extension, 0), max(minX2 - z_extension, 0))
        self.frontier = None

    def get_neighbor(self, pos, prev_moves, n):
        raise NotImplementedError

    def get_cost(self, pos):
        raise NotImplementedError

    def get_heuristic(self, pos1, pos2, iter):
        raise NotImplementedError

    def should_prune_node(self, curr_pos, prev_pos):
        raise NotImplementedError

    def get_trace(self):
        if not cython.compiled:
            print("Not using Cython")

        self.frontier = PriorityQueue()
        self.frontier.put(self.start, 0)

        costs = cython.declare(dict, {self.start: 0.0})
        prevs = cython.declare(dict, {})
        prev_moves = cython.declare(dict, {self.start: (-1, -1)})
        iters = cython.declare(cython.int, 0)
        cython.declare(curr_pos=(cython.int, cython.int, cython.int), new_pos=(cython.int, cython.int, cython.int))
        cython.declare(curr_prev_moves=(cython.int, cython.int))
        cython.declare(new_cost=cython.double, curr_cost=cython.double, g=cython.double, h=cython.double)
        cython.declare(i=cython.int)

        while not self.frontier.empty() and iters < self.limit:
            curr_pos = self.frontier.pop()
            curr_prev_moves = prev_moves[curr_pos]
            curr_cost = costs[curr_pos]
            iters += 1

            if curr_pos[0] == self.end[0] and curr_pos[1] == self.end[1] and curr_pos[2] == self.end[2]:
                break

            for i in range(self.num_moves):
                new_pos = self.get_neighbor(curr_pos, curr_prev_moves, i)
                if new_pos[0] == -123:
                    continue

                new_cost = self.get_cost(new_pos)

                if new_cost < 0:
                    continue

                if self.should_prune_node(new_pos, curr_pos):
                    continue

                g = curr_cost + new_cost

                if new_pos in prevs and g > costs[new_pos]:
                    continue

                h = self.get_heuristic(new_pos, self.end, iters)
                self.frontier.put(new_pos, g + h)
                costs[new_pos] = g
                prevs[new_pos] = curr_pos
                prev_moves[new_pos] = (curr_prev_moves[1], i)

        if self.end not in prevs:
            print("not found!")
            print("iters: ", iters)
            return []

        path: list[tuple[cython.int, cython.int, cython.int]] = [self.end]
        curr = self.end
        while curr != self.start:
            path.append(tuple(map(int, prevs[curr])))
            curr = prevs[curr]

        path = smoothen_path(path)[::-1]
        if self.res > 0:
            for i in range(len(path)):
                for j in range(3):
                    path[i][j] = (path[i][j]) * (pow(2, self.res))
        return path
