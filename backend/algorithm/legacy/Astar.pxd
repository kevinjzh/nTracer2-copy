# distutils: language=c++
cimport algorithm.legacy.tracing_utils as tracing_utils

cdef class Astar:
    cdef double[:, :, ::1] W
    cdef (int, int, int) start
    cdef (int, int, int) end
    cdef int limit
    cdef int maxX0, maxX1, maxX2
    cdef (int,int,int) offsets
    cdef double base_intensity
    cdef (int, int, int) possible_moves[6]
    cdef int num_moves
    cdef tracing_utils.PriorityQueue frontier
    cdef int res
    cdef int tracing_sensitivity


    cdef (int, int, int) get_neighbor(self, (int, int, int) pos, (int, int) prev_moves, int n)
    cdef double get_cost(self, (int, int, int) pos)
    cdef double get_heuristic(self, (int, int, int) pos1, (int, int, int) pos2, int iter)
    cdef bint should_prune_node(self, (int, int, int) curr_pos, (int, int, int) prev_pos)
    cpdef public list get_trace(self)
