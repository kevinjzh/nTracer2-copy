# distutils: language=c++
import cython
import numpy as np

#from algorithm.tracing_utils import euclidean_distance
from algorithm.legacy.Astar import Astar


class AstarSingle(Astar):
    def __init__(self, start, end, coords, is_soma=False, xy_extension=21, z_extension=7, res=0, limit=10000000):
        super().__init__(start, end, coords, is_soma, xy_extension, z_extension, res,limit)
        
        self.W = coords.layer_data[res][
            self.offsets[2]: min(self.maxX2 + z_extension, coords.layer_data[res].shape[0]),
            self.offsets[0]: min(self.maxX0 + xy_extension, coords.layer_data[res].shape[1]),
            self.offsets[1]: min(self.maxX1 + xy_extension, coords.layer_data[res].shape[2])
        ].astype(np.double)
        # self.W = uniform_filter(self.W)

        self.base_intensity =(
            self.W[self.start[2] - self.offsets[2], self.start[0] - self.offsets[0], self.start[1] - self.offsets[1]]
            + self.W[self.end[2] - self.offsets[2], self.end[0] - self.offsets[0], self.end[1] - self.offsets[1]]
        ) // 2

        background_intensity = np.quantile(self.W, 0.1)
        self.W = self.W - background_intensity

        if is_soma: 
            self.possible_moves = [(1,0,0), (0,1,0), (0,-1,0), (-1,0,0), (0,0,0), (0,0,0)]
            self.num_moves = 4
        else: 
            self.possible_moves = [(1,0,0), (0,1,0), (0,0,1), (0,0,-1), (0,-1,0), (-1,0,0)]
            self.num_moves = 6


    @cython.cdivision(True)
    @cython.boundscheck(False)
    @cython.wraparound(False)
    def get_neighbor(self, pos, prev_moves, n):
        n_p = self.num_moves - 1 - n
        if n_p == prev_moves[0] or n_p == prev_moves[1]:
            return (-123, -1, -1)
        return (pos[0]+self.possible_moves[n][0], pos[1]+self.possible_moves[n][1], pos[2]+self.possible_moves[n][2])


    @cython.cdivision(True)
    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.initializedcheck(False)
    def get_cost(self, pos):
        cython.declare(intensity=cython.double)
        cython.declare(x0=cython.int, x1=cython.int, x2=cython.int)

        x0 = pos[0] - self.offsets[0]
        x1 = pos[1] - self.offsets[1]
        x2 = pos[2] - self.offsets[2]

        if (
            x0 < 0 or x0 >= self.W.shape[1] or
            x1 < 0 or x1 >= self.W.shape[2] or
            x2 < 0 or x2 >= self.W.shape[0]
        ):
            return -1

        intensity = self.W[x2, x0, x1]
        if intensity <= 0:
            return -1
        return (self.base_intensity / intensity) * 0.1


    @cython.cdivision(True)
    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.initializedcheck(False)
    def should_prune_node(self, curr_pos, prev_pos):
        cython.declare(curr_intensity=cython.double, prev_intensity=cython.double)
        curr_intensity = self.W[curr_pos[2] - self.offsets[2], curr_pos[0] - self.offsets[0], curr_pos[1] - self.offsets[1]]
        prev_intensity = self.W[prev_pos[2] - self.offsets[2], prev_pos[0] - self.offsets[0], prev_pos[1] - self.offsets[1]]
        return (curr_intensity / prev_intensity) < 0.1


    @cython.cdivision(True)
    @cython.boundscheck(False)
    @cython.wraparound(False)
    def get_heuristic(self, pos1, pos2, iter):
        return euclidean_distance(pos1, pos2) * (0.5 + 1.5 * (iter / self.limit) ** 3)
