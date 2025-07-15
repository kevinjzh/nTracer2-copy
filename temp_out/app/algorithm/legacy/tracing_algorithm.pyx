# distutils: language=c++

from time import time
import numpy as np
cimport numpy as np
import _heapq as heapq
import cython
import multiprocessing
cimport cython
from libcpp cimport bool
from libcpp.vector cimport vector
from libcpp.queue cimport priority_queue
from math import floor, ceil

from libc.stdint cimport uint16_t

# @cython.cdivision(True)
# @cython.boundscheck(False)
# @cython.wraparound(False)
# cpdef (int, int, int) meanShift(coords, s, int maxIter = 5, int rad = 5):
#     if type(s) is tuple:
#         ic = s
#     else:
#         ic = s.mouse_voxel_coordinates

#     cdef double[3] scale = [1, 1, 1]

#     cdef double[3] x = [
#         ic[0]*scale[0],
#         ic[1]*scale[1],
#         ic[2]*scale[2]
#     ]


#     for _ in range(maxIter):
#         W = coords.im_path[
#             floor(x[2] - coords.shiftWindow // 2): ceil(x[2] + coords.shiftWindow // 2),
#             floor(x[0] - coords.shiftWindow // 2): ceil(x[0] + coords.shiftWindow // 2),
#             floor(x[1] - coords.shiftWindow // 2): ceil(x[1] + coords.shiftWindow // 2)
#         ]

#         x2, x0, x1 = center_of_mass(W)
#         x[0], x[1], x[2] = x0 + x[0] - coords.shiftWindow // 2, x1 + x[1] - coords.shiftWindow // 2, x2 + x[2] - coords.shiftWindow // 2

#     # print( "Final meanShift:", tuple(x)  )
#     return tuple([round(x[0]),round(x[1]),round(x[2])])


cdef class Point_Ref:
    cdef public int[3] minPt, maxPt, shape
    cdef public unsigned short[:, :, :, :] maze

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @staticmethod
    cdef create(unsigned short[:, :, :, :]& imPath, Coordinate pt1, Coordinate pt2):
        obj = <Point_Ref>Point_Ref.__new__(Point_Ref)
        obj.minPt = [
            max(min(pt1.x,pt2.x)-30, 0),
            max(min(pt1.y,pt2.y)-30, 0),
            max(min(pt1.z,pt2.z)-30, 0)
        ]

        obj.shape = [imPath.shape[0], imPath.shape[2], imPath.shape[3]]
        obj.maxPt = [
            min(max(pt1.x,pt2.x)+30, imPath.shape[3]),
            min(max(pt1.y,pt2.y)+30, imPath.shape[2]),
            min(max(pt1.z,pt2.z)+30, imPath.shape[0])
        ]

        obj.maze = imPath[obj.minPt[2]:obj.maxPt[2]+1,:,obj.minPt[1]:obj.maxPt[1]+1,obj.minPt[0]:obj.maxPt[0]+1]
        return obj

    @cython.boundscheck(False)
    @cython.wraparound(False)
    cdef unsigned short[:] get(Point_Ref self, unsigned short[:, :, :, :]& imPath, Coordinate pos):
        if any([curr < curr_min or curr >= curr_max for curr, curr_min, curr_max in zip(pos, self.minPt, self.maxPt)]):
            return imPath[pos.z, :, pos.y, pos.x]
        else:
            m_index = tuple([i - j for i, j in zip(pos, self.minPt)])
            return self.maze[m_index[2], : ,m_index[1],m_index[0]]

    @cython.boundscheck(False)
    @cython.wraparound(False)
    @cython.cdivision(True)
    cdef double[:] area(Point_Ref self, unsigned short[:, :, :, :]& imPath, Coordinate pos, int a):
        if a == 0:
            return np.array(self.get(imPath, pos), dtype=np.double)

        global kernel
        cdef Coordinate pos_norm = Coordinate(
            pos.x,
            pos.y,
            pos.z
        )
        #*[i - j for i, j in zip(pos, self.minPt)]

        cdef int x1 = pos_norm.x-a if 0 <= pos_norm.x-a else 0
        cdef int x2 = pos_norm.x+a+1 if pos_norm.x+a < self.shape[1] else self.shape[1]

        cdef int y1 = pos_norm.y-a if 0 <= pos_norm.y-a else 0
        cdef int y2 = pos_norm.y+a+1 if pos_norm.y+a < self.shape[2] else self.shape[2]

        cdef int z1 = pos_norm.z-a if 0 <= pos_norm.z-a else 0
        cdef int z2 = pos_norm.z+a+1 if pos_norm.z+a < self.shape[0] else self.shape[0]

        cdef int xD = 7 - (x2 - x1)
        cdef int yD = 7 - (y2 - y1)
        cdef int zD = 7 - (z2 - z1)
        cdef unsigned short count = (x2 - x1) * (y2 - y1) * (z2 - z1)

        return np.sum(imPath[z1:z2,:,x1:x2,y1:y2], axis=(0, 2, 3)) / count

@cython.boundscheck(False)
@cython.wraparound(False)
cdef short shortSum(unsigned short[:]& arr, int size):
    cdef short result = 0
    for i in range(size):
        result += arr[i]
    return result

@cython.boundscheck(False)
@cython.wraparound(False)
cdef double doubleSum(double[:]& arr, int size):
    cdef double result = 0
    for i in range(size):
        result += arr[i]
    return result

cdef class Coordinate:
    cdef public int x, y, z

    def __init__(Coordinate self, int x, int y, int z):
        self.x = x
        self.y = y
        self.z = z

    @staticmethod
    cdef Coordinate create(int x, int y, int z):
        obj = <Coordinate>Coordinate.__new__(Coordinate)
        obj.x, obj.y, obj.z = x, y, z
        return obj
    
    cdef vector[int] get_arr(Coordinate self):
        return [self.x, self.y, self.z]

    def __eq__(Coordinate self, Coordinate other):
        return self.x == other.x and self.y == other.y and self.z == other.z

    def __hash__(Coordinate self):
        return hash((self.x, self.y, self.z))

    def __iter__(Coordinate self):
        return CoordinateIterator(self)  

    def __str__(Coordinate self):
        return "({}, {}, {})".format(self.x, self.y, self.z)

cdef class CoordinateIterator:
    cdef Coordinate _coordinate
    cdef int _index

    def __init__(CoordinateIterator self, Coordinate coordinate):
        self._coordinate = coordinate
        self._index = -1
    
    def __next__(CoordinateIterator self):
        self._index += 1
        if self._index == 0:
            return self._coordinate.x
        elif self._index == 1:
            return self._coordinate.y
        elif self._index == 2:
            return self._coordinate.z
        else:
            raise StopIteration

cdef class Node:
    cdef public Node parent
    cdef public Coordinate position
    cdef public float g, h, f

    @staticmethod
    cdef Node create(Node parent, Coordinate position, float g, float h , float f):
        obj = <Node>Node.__new__(Node)
        obj.parent, obj.position, obj.g, obj.h, obj.f = parent, position, g, h, f
        return obj
    
    def __eq__(Node self, Node other):
        return self.position == other.position

    def __lt__(Node self, Node other):
        return self.f < other.f