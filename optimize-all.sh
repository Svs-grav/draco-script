#!/bin/bash

# Check if the correct number of arguments are provided
if [ "$#" -ne 3 ]; then
	echo "Usage: $0 <input_directory> <output_directory> <concurrency>"
	exit 1
fi

# Directory containing the GLB files
INPUT_DIR="$1"
OUTPUT_DIR="$2"
CONCURRENCY="$3"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to optimize a single GLB file
optimize_glb() {
	local input_file=$1
	local output_file=$2

	gltf-transform optimize "$input_file" "$output_file" --texture-compress webp
	echo "Optimized $input_file -> $output_file"
}

export -f optimize_glb

# Find all GLB files and process them with limited concurrency
find "$INPUT_DIR" -name "*.glb" | parallel -j "$CONCURRENCY" optimize_glb {} "$OUTPUT_DIR/{/}_optimized.glb"
