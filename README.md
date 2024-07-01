## Draco GLB to GZIP compress script

- Requires Node

## Usage

`git clone https://github.com/Svs-grav/draco-script`

`cd draco-script`

`node index.js <input_folder_path> <output_folder_path> <concurrency> `

- Input and output folders - relative './path/to/directory' or absolute 'C:/path/to/directory' paths
- Concurrency - 16 should be a good baseline, 24 or more could be faster on bigger CPUs with more cores
