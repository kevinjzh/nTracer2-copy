# distutils: language=c++
from algorithm.legacy.Astar cimport Astar
from algorithm.legacy.tracing_utils cimport euclidean_distance

cdef class AstarSingle(Astar):
    pass
