from __future__ import annotations

import functools
from typing import TYPE_CHECKING, Callable, Concatenate, ParamSpec, TypeVar

from flask_socketio import SocketIO

if TYPE_CHECKING:
    from ntracer.ntracer_state import NtracerState

T = TypeVar("T")
P = ParamSpec("P")


def __get_injector():
    singleton_data: dict[str, NtracerState | SocketIO] = {}

    def set_socketio(s: SocketIO):
        nonlocal singleton_data
        if "socketio" in singleton_data:
            raise Exception("SocketIO already set")

        print("Setting socketio")
        singleton_data["socketio"] = s

    def inject_state(f: Callable[Concatenate[NtracerState, P], T]) -> Callable[P, T]:
        @functools.wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            nonlocal singleton_data
            from ntracer.ntracer_state import NtracerState

            if "state" not in singleton_data or not isinstance(
                singleton_data["state"], NtracerState
            ):
                print("Creating new state")
                singleton_data["state"] = NtracerState()

            return f(singleton_data["state"], *args, **kwargs)

        return wrapper

    def inject_state_and_socket(
        f: Callable[Concatenate[NtracerState, SocketIO, P], T]
    ) -> Callable[P, T]:
        @functools.wraps(f)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            from ntracer.ntracer_state import NtracerState

            nonlocal singleton_data
            if "state" not in singleton_data or not isinstance(
                singleton_data["state"], NtracerState
            ):
                print("Creating new state")
                singleton_data["state"] = NtracerState()

            if "socketio" not in singleton_data or not isinstance(
                singleton_data["socketio"], SocketIO
            ):
                raise Exception("SocketIO not set")

            return f(
                singleton_data["state"], singleton_data["socketio"], *args, **kwargs
            )

        return wrapper

    return inject_state, inject_state_and_socket, set_socketio


# singleton instance, manage this if we want to have multiple states
inject_state, inject_state_and_socketio, set_socketio = __get_injector()

@inject_state
def get_state(state: NtracerState) -> NtracerState:
    return state
