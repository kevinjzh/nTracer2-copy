#ifndef _H_astar_multi
#define _H_astar_multi

#include <vector>
#include "astar.h"

class AstarMulti {
    protected:
    float ****intensity;
    int *dims;
    float* base_intensity;
    float base_intensity_sum;

    void get_neighbors(Point &pos, int num_moves, Point* neighbors);
    bool in_bounds(Point &pos);
    float get_heuristic(Point &u, Point &v);
    bool is_goal(Point &pos, Point &goal);
    float get_cost(Point &u);
    std::vector<Point> smoothen_path(std::vector<Point> &path);

    public:
    AstarMulti(float ****intensity, int dims[3], float* base_intensity): intensity(intensity), dims(dims), base_intensity(base_intensity) {
        base_intensity_sum = base_intensity[0] + base_intensity[1] + base_intensity[2];
    }
    AstarResult find_path_3d(Point& start, Point& end, bool is_soma);
};

#endif