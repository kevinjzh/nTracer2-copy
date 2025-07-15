#include "astar.h"
#include "math.h"
#include <cmath>
#include <queue>
#include <vector>

bool operator<(const Node t1, const Node t2) {
    return t1.est_cost > t2.est_cost;
}


AstarResult Astar::find_path_3d(Point& start, Point& end, bool is_soma) {
    int num_moves = (is_soma) ? 4 : 6;
    
    std::priority_queue<Node> frontier;
    Point*** prevs = new Point**[dims[0]];
    for (int i = 0; i < dims[0]; ++i) {
        prevs[i] = new Point*[dims[1]];
        for (int j = 0; j < dims[1]; ++j) {
            prevs[i][j] = new Point[dims[2]];
            for (int k = 0; k < dims[2]; ++k) {
                prevs[i][j][k] = Point(-1, -1, -1);
            }
        }
    }

    Node n = {start, 0, 0};
    frontier.push(n);
    bool found = false;

    while (!frontier.empty() && !found) {
        auto curr = frontier.top();
        frontier.pop();
        Point& pos = curr.point;
        Point neighbors[6];
        get_neighbors(pos, num_moves, neighbors);

        for (int i = 0; i < num_moves; ++i) {
            Point& new_pos = neighbors[i];
            if (in_bounds(new_pos) && prevs[new_pos.x0][new_pos.x1][new_pos.x2].x0 == -1) {
                prevs[new_pos.x0][new_pos.x1][new_pos.x2] = curr.point;
                if (is_goal(new_pos, end)) {
                    found = true;
                    break;
                }
                float c = get_cost(new_pos) + curr.cost;
                float est_c = c + get_heuristic(curr.point, new_pos);
                Node new_n = {new_pos, c, est_c};
                frontier.push(new_n);
            }
        }
    }

    AstarResult result;
    
    if (found) {
        Point& curr = end;
        std::vector<Point> res;
        while (!is_goal(curr, start)) {
            res.push_back(curr);
            curr = prevs[curr.x0][curr.x1][curr.x2];
        }
        std::vector<Point> f_res = smoothen_path(res);

        Point *arr = new Point[f_res.size()];
        for (int i = 0; i < f_res.size(); ++i) {
            arr[i] = f_res[f_res.size() - i - 1];
        }
        AstarResult result = {f_res.size(), arr};
        return result;
    } else{
    }

    for (int i = 0; i < dims[0]; ++i) {
        for (int j = 0; j < dims[1]; ++j) {
            delete prevs[i][j];
        }
        delete[] prevs[i];
    }
    delete[] prevs;

    return AstarResult();
}


void Astar::get_neighbors(Point &pos, int num_moves, Point* neighbors) {
    neighbors[0] = Point(pos.x0+1, pos.x1, pos.x2);
    neighbors[1] = Point(pos.x0, pos.x1+1, pos.x2);
    neighbors[2] = Point(pos.x0-1, pos.x1, pos.x2);
    neighbors[3] = Point(pos.x0, pos.x1-1, pos.x2);
    if (num_moves == 6) {
        neighbors[4] = Point(pos.x0, pos.x1, pos.x2+1);
        neighbors[5] = Point(pos.x0, pos.x1, pos.x2-1);
    }
}

bool Astar::in_bounds(Point& pos) {
    return pos.x0 < dims[0] && pos.x0 >= 0 && pos.x1 < dims[1] && pos.x1 >= 0 && pos.x2 < dims[2] && pos.x2 >= 0;
}

float Astar::get_cost(Point &u) {
    return pow(base_intensity / intensity[u.x0][u.x1][u.x2], 1.5);
}

float Astar::get_heuristic(Point &u, Point &v) {
    // Euclidean distance * terminal cost
    float terminal_cost = (
        get_cost(u)
        +  get_cost(u)
    ) / 2;
    float euclidean_distance = sqrt(
        pow(u.x0 - v.x0, 2)
        + pow(u.x1 - v.x1, 2)
        + pow(u.x2 - v.x2, 2)
    );

    return euclidean_distance * terminal_cost;
}

bool Astar::is_goal(Point &pos, Point &goal) {
    return (pos.x0 == goal.x0) && (pos.x1 == goal.x1) && (pos.x2 == goal.x2);
}

std::vector<Point> Astar::smoothen_path(std::vector<Point> &path) {
    Point curr = path[0];
    std::vector<Point> res;

    int delta[3] = {0, 0, 0};

    for (int i = 1; i < path.size(); ++i) {
        Point& point = path[i];
        Point& prev = path[i - 1];
        int curr_delta[3] = { point.x0-prev.x0, point.x1-prev.x1, point.x2-prev.x2 };
        bool added = false;
        for (int j = 0; j < 3; ++j) {
            if (abs(delta[j] + curr_delta[j]) == 2) {
                res.push_back(Point(curr.x0 + delta[0], curr.x1 + delta[1], curr.x2 + delta[2]));
                curr = res.back();
                delta[0] = curr_delta[0];
                delta[1] = curr_delta[1];
                delta[2] = curr_delta[2];
                added = true;
                break;
            }
        }
        if (!added) {
            delta[0] += curr_delta[0];
            delta[1] += curr_delta[1];
            delta[2] += curr_delta[2];
        }
    }

    res.push_back(Point(curr.x0 + delta[0], curr.x1 + delta[1], curr.x2 + delta[2]));
    return res;
}
