const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

// Function to run a command with a promise
const runCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

// Function to optimize a single GLB file using npx to run gltf-transform
const optimizeGLB = async (inputFile, outputFile) => {
  const cmd = `npx gltf-transform optimize "${inputFile}" "${outputFile}" --texture-compress webp`;
  await runCommand(cmd);
  console.log(`Optimized ${inputFile} -> ${outputFile}`);
};

// Function to gzip a file
const gzipFile = (inputFile, outputFile) => {
  return new Promise((resolve, reject) => {
    const fileContents = fs.createReadStream(inputFile);
    const writeStream = fs.createWriteStream(outputFile);
    const zip = zlib.createGzip();

    fileContents
      .pipe(zip)
      .pipe(writeStream)
      .on("finish", (err) => {
        if (err) {
          reject(err);
        } else {
          // Delete the input file after gzip compression is complete
          fs.unlink(inputFile, (unlinkErr) => {
            if (unlinkErr) {
              reject(unlinkErr);
            } else {
              resolve();
              console.log(
                `Compressed and deleted ${inputFile} -> ${outputFile}`,
              );
            }
          });
        }
      });
  });
};

// Function to process files with limited concurrency
const processFilesWithConcurrency = async (files, outputDir, concurrency) => {
  const queue = [...files];
  const activeTasks = [];

  const runNext = async () => {
    if (queue.length === 0) return;

    const inputFile = queue.shift();
    const baseName = path.basename(inputFile, ".glb");
    const optimizedFile = path.join(outputDir, `${baseName}_optimized.glb`);
    const gzippedFile = `${optimizedFile}.gz`;

    const task = optimizeGLB(inputFile, optimizedFile)
      .then(() => gzipFile(optimizedFile, gzippedFile))
      .finally(() => {
        activeTasks.splice(activeTasks.indexOf(task), 1);
        runNext();
      });

    activeTasks.push(task);
    if (activeTasks.length < concurrency) {
      runNext();
    }

    await Promise.all(activeTasks);
  };

  await runNext();
};

// Main function
const main = async () => {
  const [inputDir, outputDir, concurrency] = process.argv.slice(2);

  if (!inputDir || !outputDir || !concurrency) {
    console.error(
      "Usage: node index.js <input_directory> <output_directory> <concurrency>",
    );
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((file) => file.endsWith(".glb"))
    .map((file) => path.join(inputDir, file));

  await processFilesWithConcurrency(
    files,
    outputDir,
    parseInt(concurrency, 10),
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
