from setuptools import setup
from Cython.Build import cythonize
import numpy
import os

from Cython.Compiler.Options import get_directive_defaults
directive_defaults = get_directive_defaults()

directive_defaults['linetrace'] = True
directive_defaults['binding'] = True

os.environ['CFLAGS'] = '-Ofast'

#os.environ['CFLAGS'] = '-O3 -Wall -std=c++11 -stdlib=libc++'

setup(
    ext_modules=cythonize(
        # ["test.py"],
        [
            "algorithm/astar/*.py",
            "algorithm/astar/*.pyx",
            "algorithm/astar/astar.cpp",
        ],
        language="c++",
        language_level="3",
        annotate=True,
        compiler_directives={"always_allow_keywords": True}
    ),
    include_dirs=[numpy.get_include()],
)
