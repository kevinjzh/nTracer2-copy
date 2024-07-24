#!/bin/bash

# Start the first process
python main.py -a 0.0.0.0 -p 8050 &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
