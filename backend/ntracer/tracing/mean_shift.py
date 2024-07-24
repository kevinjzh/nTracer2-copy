import requests


def mean_shift(
    pt: tuple[float, float, float], server_url: str, dataset_id: str
) -> tuple[int, int, int]:
    start = [round(c) for c in pt]
    res = requests.get(
        f"{server_url}/{dataset_id}/meanshift/{start[0]},{start[1]},{start[2]}"
    )
    return tuple((int(x) for x in res.text.split(",")))
