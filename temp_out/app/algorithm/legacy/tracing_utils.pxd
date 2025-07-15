# distutils: language=c++
from libcpp.queue cimport priority_queue
from libcpp.vector cimport vector

cdef extern from *:
    """
    typedef struct {
        double cost;
        int x0, x1, x2;
    } Node;

    bool operator<(const Node t1, const Node t2) {
        return t1.cost > t2.cost;
    }
    """
    ctypedef struct Node:
        double cost
        int x0, x1, x2


cdef class PriorityQueue:
    cdef priority_queue[Node] pq

    cdef bint empty(self)
    cdef put(self, (int, int, int) d, double priority)
    cdef (int, int, int) pop(self)


cdef int manhatten_distance((int, int, int) pos1, (int, int, int) pos2)
cdef double euclidean_distance((int, int, int) pos1, (int, int, int) pos2)


cdef class CoordVector:
    cdef vector[(int, int, int)] v
    cdef list l
    cdef push_back(self, (int, int, int) d)
    cdef int size(self)
    cdef (int, int, int) get(self, i)
