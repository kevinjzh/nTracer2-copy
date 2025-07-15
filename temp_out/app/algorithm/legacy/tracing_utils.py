# distutils: language=c++
import heapq
import cython

class PriorityQueue:
    def __init__(self):
        if not cython.compiled:
            self.heap = []

    def empty(self):
        if not cython.compiled:
            return len(self.heap) == 0
        else:
            return self.pq.empty()

    def put(self, d, priority):
        if not cython.compiled:
            heapq.heappush(self.heap, (priority, d))
        else:
            self.pq.push(Node(priority, d[0], d[1], d[2]))

    def pop(self):
        if not cython.compiled:
            return heapq.heappop(self.heap)[1]
        else:
            cython.declare(item=Node)
            item = self.pq.top()
            self.pq.pop()
            return (item.x0, item.x1, item.x2)


def smoothen_path(path):
    curr = path[0]
    condensed_path = []
    delta = [0, 0, 0]
    for i in range(1, len(path)):
        point = path[i]
        prev = path[i - 1]
        curr_delta = [i - j for i, j in zip (point, prev)]
        for i in range(3):
            if abs(delta[i] + curr_delta[i]) == 2:
                condensed_path.append(
                    [k + l for k, l in zip(curr, delta)]
                )
                curr = condensed_path[-1]
                delta = curr_delta
                break
        else:
            delta = [k + l for k, l in zip(delta, curr_delta)]
    condensed_path.append(
        [k + l for k, l in zip(curr, delta)]
    )
    return condensed_path


class CoordVector:
    def __init__(self, arr):
        if not cython.compiled:
            self.l= arr
        else:
            self.v= arr
    
    def push_back(self, d):
        if not cython.compiled:
            self.l.append(d)
        else:
            self.v.push_back(d)
    
    def size(self):
        if not cython.compiled:
            return len(self.l)
        else:
            return self.v.size()

    def get(self, i):
        if not cython.compiled:
            return self.l[i]
        else:
            return self.v[i]


def euclidean_distance(pos1, pos2):
    return ((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2 + (pos1[2] - pos2[2])**2)**0.5

def manhatten_distance(pos1, pos2):
    return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1]) + abs(pos1[2] - pos2[2])

def waypoint_distance(pos1, pos2, waypoints, distance_fun):
    max_distance = 0
    for waypoint in waypoints:
        max_distance = max(max_distance, distance_fun(pos1, waypoint) - distance_fun(pos2, waypoint))
    return max_distance
