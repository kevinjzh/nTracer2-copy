#ifndef _H_astar
#define _H_astar

#include <vector>

struct Point {
    int x0;
    int x1;
    int x2;
    Point() {}
    Point(int x0, int x1, int x2): x0(x0), x1(x1), x2(x2) {}
};

struct AstarResult {
    int path_length;
    Point *path;
};

struct Node {
    Point point;
    float cost;
    float est_cost;
};

class Astar {
    protected:
    float ***intensity;
    int *dims;
    float base_intensity;

    void get_neighbors(Point &pos, int num_moves, Point* neighbors);
    bool in_bounds(Point &pos);
    float get_heuristic(Point &u, Point &v);
    bool is_goal(Point &pos, Point &goal);
    float get_cost(Point &u);
    std::vector<Point> smoothen_path(std::vector<Point> &path);

    public:
    Astar(float ***intensity, int dims[3], float base_intensity): intensity(intensity), dims(dims), base_intensity(base_intensity) {}
    AstarResult find_path_3d(Point& start, Point& end, bool is_soma);
};

#endif