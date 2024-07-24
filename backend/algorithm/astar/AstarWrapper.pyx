# distutils: language=c++

from random import uniform
import numpy as np
from time import time

from libcpp cimport bool
from libc.stdlib cimport malloc, free

cdef extern from "astar.cpp":
    pass

cdef extern from "astar_multi.cpp":
    pass

cdef extern from "astar.h":
    struct Point:
      int x0
      int x1
      int x2
    
    struct AstarResult:
      int path_length
      Point* path
     
    cppclass Astar:
        Astar(float*** cm, int d[3], float base_intensity)
        AstarResult find_path_3d(Point& start, Point& end, bool is_soma)

cdef extern from "astar_multi.h":     
    cppclass AstarMulti:
        AstarMulti(float**** cm, int d[3], float* base_intensity)
        AstarResult find_path_3d(Point& start, Point& end, bool is_soma)


class AstarWrapper():    
    def __init__(self, is_soma=False, xy_extension=21, z_extension=7, tracing_sensitivity=5, is_multi=False):
        self.is_soma = is_soma
        self.xy_extension = xy_extension
        self.z_extension = z_extension
        self.tracing_sensitivity = tracing_sensitivity
        self.is_multi = is_multi

    def get_trace(self, start, end, arr):
        t0 = time()
        start = list(map(int, start))
        end = list(map(int, end))

        minX0, minX1, minX2 = min(start[0], end[0]), min(start[1], end[1]), min(start[2], end[2])
        self.maxX0, self.maxX1, self.maxX2 = max(start[0], end[0]), max(start[1], end[1]), max(start[2], end[2])
        self.offsets = (max(minX0 - self.xy_extension, 0), max(minX1 - self.xy_extension, 0), max(minX2 - self.z_extension, 0))

        self.W = arr[
            self.offsets[0]: min(self.maxX0 + self.xy_extension, arr.shape[0]),
            self.offsets[1]: min(self.maxX1 + self.xy_extension, arr.shape[1]),
            self.offsets[2]: min(self.maxX2 + self.z_extension, arr.shape[2]),
        ].astype(np.double)
        t1 = time()
        # self.W = uniform_filter(self.W)
        self.base_intensity = (
            self.W[start[0] - self.offsets[0], start[1] - self.offsets[1], start[2] - self.offsets[2]]
            + self.W[end[0] - self.offsets[0], end[1] - self.offsets[1], end[2] - self.offsets[2]]
        ) // 2

        cdef Point p1
        p1.x0 = start[0] - self.offsets[0]
        p1.x1 = start[1] - self.offsets[1]
        p1.x2 = start[2] - self.offsets[2]

        cdef Point p2
        p2.x0 = end[0] - self.offsets[0]
        p2.x1 = end[1] - self.offsets[1]
        p2.x2 = end[2] - self.offsets[2]

        cdef int dims[3]
        dims[:] = [self.W.shape[0], self.W.shape[1], self.W.shape[2]]

        cdef float*** W
        cdef float**** W_multi
        if self.is_multi:
            W_multi = get_c_arr_multi(self.W)
        else:
            W = get_c_arr(self.W)

        cdef float base_intensity[3]
        cdef float base_intensity_i
        cdef Astar* astar
        cdef AstarMulti* astar_multi
        cdef AstarResult res

        if self.is_multi:
            base_intensity[:] = [self.base_intensity[0], self.base_intensity[1], self.base_intensity[2]]
            astar_multi = new AstarMulti(W_multi, dims, base_intensity)
            t2 = time()
            res = astar_multi.find_path_3d(p1, p2, self.is_soma)
            t3 = time()
        else:
            base_intensity_i = self.base_intensity
            astar = new Astar(W, dims, base_intensity_i)
            t2 = time()
            res = astar.find_path_3d(p1, p2, self.is_soma)
            t3 = time()

        
        points = [(int(res.path[i].x0+self.offsets[0]), int(res.path[i].x1+self.offsets[1]), int(res.path[i].x2+self.offsets[2])) for i in range(res.path_length)]

        # Cleanup
        if self.is_multi:
            for i in range(dims[0]):
                for j in range(dims[1]):
                    for k in range(dims[2]):
                        free(W_multi[i][j][k])
                    free(W_multi[i][j])
                free(W_multi[i])
            free(W_multi)
        else:
            for i in range(dims[0]):
                for j in range(dims[1]):
                    free(W[i][j])
                free(W[i])
            free(W)
        
        free(res.path)

        return points


cdef float*** get_c_arr(double[:,:,:] arr):
    t1 = time()
    cdef float*** W = <float ***> malloc(arr.shape[0] * sizeof(float**))
    cdef int i, j, k
    for i in range(arr.shape[0]):
        W[i] = <float**> malloc(arr.shape[1] * sizeof(float*))
        for j in range(arr.shape[1]):
            W[i][j] = <float*> malloc(arr.shape[2] * sizeof(float))
            for k in range(arr.shape[2]):
                W[i][j][k] = arr[i][j][k]
    t2 = time()
    return W

cdef float**** get_c_arr_multi(double[:,:,:,:] arr):
    t1 = time()
    cdef float**** W = <float ****> malloc(arr.shape[0] * sizeof(float***))
    cdef int i, j, k, c
    for i in range(arr.shape[0]):
        W[i] = <float***> malloc(arr.shape[1] * sizeof(float**))
        for j in range(arr.shape[1]):
            W[i][j] = <float**> malloc(arr.shape[2] * sizeof(float*))
            for k in range(arr.shape[2]):
                W[i][j][k] = <float*> malloc(arr.shape[3] * sizeof(float))
                for c in range(arr.shape[3]):
                    W[i][j][k][c] = arr[i][j][k][c]
    t2 = time()
    return W
