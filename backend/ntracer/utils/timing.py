from time import time
import functools

def print_time(tag: str):
    def decorator(func):
        @functools.wraps(func)
        def time_wrapper(*args, **kwargs):
            start_time = time()
            result = func(*args, **kwargs)
            end_time = time()
            print(f'[{tag}] {func.__name__}: {end_time - start_time:.4f}s')
            return result
        return time_wrapper
    return decorator
