from math import ceil
import multiprocessing
# cimport numpy as np
from algorithm.legacy.AstarSingle import AstarSingle
from algorithm.legacy.tracing_algorithm import meanShift

def get_trace(coords, start, end, is_soma=False, xy_extension=21, z_extension=7, rScale = 10,seg_len=100):
    if len(coords.im_path.shape) == 3:
        manager = multiprocessing.Manager()
        rtrn = manager.dict()

        d = abs(start[0]-end[0])+abs(start[1]-end[1])+abs(start[2]-end[2])
        r = int((d**(1/2))//rScale)
        if r>5: r=5

        print("Resoltion Index: ",r)

        p = multiprocessing.Process(target=traceThread,name="Trace",args=(rtrn,"Trace", coords, start, end, is_soma, xy_extension, z_extension, r, seg_len,False))
        p.start()
        p.join(15)
        
        if len(multiprocessing.active_children())>1 or not("Trace" in rtrn):
            print("Timed out of astar trace")
            for t,x in enumerate(multiprocessing.active_children()):
                if x.name == "Trace" or len(x.name) < 4:
                    x.terminate()
                    x.join()
            return []
        else:
            print("Astar finished")
            print("Trace length: ", len(rtrn['Trace']))
            return rtrn['Trace']
        # return astar_single_channel(coords.imPath, start, end, is_soma, xy_extension, z_extension)
    else:
        pass
        # return astar_color(coords.imPath, start, end, is_soma, xy_extension, z_extension)

def traceThread(rtrn, name, coords, start, end, is_soma, xy_extension, z_extension, res, seg_len,thread_ind=False):
    tracer = AstarSingle(start, end, coords, is_soma, xy_extension, z_extension,res)
    path = tracer.get_trace()
    
    if len(path) == 0: return

    if res>0:
        print("low res found")
        ln = len(path)
        d = ceil(ln*(pow(2,res))/seg_len)
        if d<2: d=2
        proc = []
        s = ln//d+1

        for i in range(d):
            si = int(i*s)
            ei = int((i+1)*s)
            if ei>=ln: ei = ln-1

            st = tuple([path[si][0],path[si][1],path[si][2]])
            en = tuple([path[ei][0],path[ei][1],path[ei][2]])

            st = meanShift(coords, st, 2, pow(2,res))
            en = meanShift(coords, en, 2, pow(2,res))

            proc.append(multiprocessing.Process(target=traceThread, name="sub"+str(i), args=(rtrn, str(i), coords, st, en, is_soma, xy_extension, z_extension, 0, seg_len)))
            proc[i].start()
    
        for pr in proc:
            pr.join(10)
            if pr.is_alive(): return

        path = []
        for i in range(d):
            if not(str(i) in rtrn): return
            path += rtrn[str(i)]
            if thread_ind:
                segment = rtrn[str(i)][-1]
                segment[1]+=10
                path+=[segment]
        rtrn[name] = path
        print("threads: ",d)
        return 

    rtrn[name] = path


# def astar_color(img, start, end, is_soma=False, xy_extension=21, z_extension=7):
#     cython.declare(minX0=cython.int, minX1=cython.int, minX2=cython.int, maxX0=cython.int, maxX1=cython.int, maxX2=cython.int)
#     cython.declare(offset0=cython.int, offset1=cython.int, offset2=cython.int)

#     minX0, minX1, minX2 = min(start[0], end[0]), min(start[1], end[1]), min(start[2], end[2])
#     maxX0, maxX1, maxX2 = max(start[0], end[0]), max(start[1], end[1]), max(start[2], end[2])
#     offset0, offset1, offset2 = max(minX0 - xy_extension, 0), max(minX1 - xy_extension, 0), max(minX2 - z_extension, 0)

#     cython.declare(num_channels=cython.int)
#     num_channels = img.shape[3]

#     cython.declare(W=cython.double[:, :, :, :])
#     W = img[
#         offset2: min(maxX2 + z_extension, img.shape[0]),
#         offset0: min(maxX0 + xy_extension, img.shape[1]),
#         offset1: min(maxX1 + xy_extension, img.shape[2]),
#         :
#     ].astype(np.double)

#     # Mean smoothing, kernel size = 3
#     W = uniform_filter1d(W, axis=0)
#     W = uniform_filter1d(W, axis=1)
#     W = uniform_filter1d(W, axis=2)
#     print(W.shape)

#     # Reference intensity
#     cython.declare(base_intensity=(cython.double, cython.double, cython.double))
#     base_intensity = tuple(np.mean(
#         [W[start[2] - offset2, start[0] - offset0, start[1] - offset1, :],
#         W[end[2] - offset2, end[0] - offset0, end[1] - offset1, :]],
#         axis=(0,1,2)
#     ))
#     print("base", base_intensity)

#     # Thresholding
#     # background_intensity = np.quantile(W, 0.1)
#     # W = W - background_intensity

#     # Functions
#     # @cython.locals(pos=(cython.int, cython.int, cython.int), prev_moves=(cython.int, cython.int))
#     def get_neighbors(pos, prev_moves):
#         cython.declare(new_moves=list, i=cython.int, move=(cython.int, cython.int, cython.int))
#         new_moves = []

#         for i in range(len(possible_moves)):
#             move = possible_moves[i]
#             i_p = len(possible_moves) - i
#             if i_p == prev_moves[0] or i_p == prev_moves[1]:
#                 continue
#             new_moves.append(((pos[0]+move[0], pos[1]+move[1], pos[2]+move[2]), i))
#         return new_moves

#     # @cython.cfunc
#     # @cython.locals(pos=(cython.int, cython.int, cython.int))
#     def get_cost(pos):
#         cython.declare(intensity=cython.double[:], ti=cython.double, color_distance=cython.double, i=cython.int)

#         intensity = W[pos[2] - offset2, pos[0] - offset0, pos[1] - offset1, :]
#         ti = np.sum(intensity)
#         if ti <= 0:
#             return -1
#         color_distance = 0
#         for i in range(num_channels):
#             color_distance += (base_intensity[i] - intensity[i] / ti) ** 2
#         return color_distance + (np.sum(base_intensity) / ti) * 0.1

#     # @cython.cfunc
#     # @cython.locals(pos1=(cython.int, cython.int, cython.int), pos2=(cython.int, cython.int, cython.int))
#     def get_heuristic(pos1, pos2):
#         return manhatten_distance(pos1, pos2)

#     return astar(start, end, get_neighbors, get_cost, get_heuristic)


# def mean_shift(coords, s, xy_radius=5, z_radius=2, iterations=5):
#     ic = s.mouse_voxel_coordinates
#     return tuple(map(round, [ic[0], ic[1], ic[2], ic[0], ic[1], ic[2]]))

#     scale = [1, 1, 1]
#     x = [
#         round(ic[0]*scale[0]),
#         round(ic[1]*scale[1]),
#         round(ic[2]*scale[2])
#     ]

#     minX0, minX1, minX2 = x[0] - (xy_radius * iterations), x[1] - (xy_radius * iterations), x[2] - (z_radius * iterations)
#     maxX0, maxX1, maxX2 = x[0] + (xy_radius * iterations), x[1] + (xy_radius * iterations), x[2] + (z_radius * iterations)
#     offset0, offset1, offset2 = max(minX0, 0), max(minX1, 0), max(minX2, 0)

#     W = coords.imPath[
#         offset2: min(maxX2, coords.imPath.shape[0]),
#         offset0: min(maxX0, coords.imPath.shape[1]),
#         offset1: min(maxX1, coords.imPath.shape[2])
#     ]

#     print("start", tuple(x))

#     xp = [x[0] - offset0, x[1] - offset1, x[2] - offset2]
#     for _ in range(iterations):
#         offsetp0, offsetp1, offsetp2 = min(floor(xp[0] - xy_radius), 0), min(floor(xp[1] - xy_radius), 0), min(floor(xp[2] - z_radius), 0)
#         Wp = W[
#             offsetp2: max(ceil(xp[2] + z_radius), W.shape[0]),
#             offsetp0: max(ceil(xp[0] + xy_radius), W.shape[1]),
#             offsetp1: max(ceil(xp[1] + xy_radius), W.shape[2])
#         ]

#         x2, x0, x1 = center_of_mass(Wp)
#         xp[0], xp[1], xp[2] = x0 + offsetp0, x1 + offsetp1, x2 + offsetp2


#     x[0], x[1], x[2] = round(xp[0] + offset0), round(xp[1] + offset1), round(xp[2] + offset2)
#     print( "Final meanShift:", tuple(x)  )
#     y = [0,0,0,x[0],x[1],x[2] ]

#     for i in range(3):
#         y[i] = x[i] // scale[i]

#     return tuple(y)
