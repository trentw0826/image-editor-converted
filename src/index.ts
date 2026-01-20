import { readFileSync, writeFileSync } from "fs";

const args = process.argv.slice(2);

interface Image {
  width: number;
  height: number;
  pixels: Color[][]; // 2D array of pixels [row][column]
}

interface Color {
  red: number;
  green: number;
  blue: number;
}

const main = async (): Promise<void> => {
  if (args.length < 3 || args.length >= 5) {
    usage();
    process.exit(1);
  }

  const inFile = String(args[0]);
  const outFile = String(args[1]);

  let image: any;
  try {
    image = readImage(inFile);
    console.log(`Image loaded successfully: ${image.width}x${image.height}`);
    // console.log(`Image pixels:`, image.pixels);
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    process.exit(1);
  }

  switch (args[2]) {
    case "grayscale":
      console.log("grayscale", "Output:", outFile);
      grayscale(image, outFile);
      break;

    case "invert":
      console.log("invert");
      invert(image, outFile);
      break;

    case "emboss":
      console.log("emboss");
      emboss(image, outFile);
      break;

    case "motionblur":
      if (args.length !== 4) {
        usage();
        process.exit(1);
      }

      const motionBlurLength: number = Number(args[3]);
      if (isNaN(motionBlurLength)) {
        usage();
        process.exit(1);
      }

      motionblur(image, outFile, motionBlurLength);
      break;

    default:
      usage();
      process.exit(1);
  }
};

// Reads a PPM P3 file and returns an Image object
const readImage = (filename: string): Image => {
  const content = readFileSync(filename, "utf-8");

  // Split content into tokens separated by whitespace
  const tokens = content.split(/\s+/);

  let index = 0;

  // Skip the P3 header
  index++;

  // Safety check
  if (tokens.length < 4) {
    throw new Error("Invalid PPM file");
  }

  // Read width and height
  const width = parseInt(tokens[index++]!, 10);
  const height = parseInt(tokens[index++]!, 10);

  // Skip max color value (assumed to be 255)
  index++;

  // Safety check: validate number of tokens
  const expectedTokens = 4 + width * height * 3; // 4 header + RGB values
  if (tokens.length < expectedTokens) {
    throw new Error(
      `Malformed PPM file: expected ${expectedTokens} tokens, got ${tokens.length}`,
    );
  }

  const pixels: Color[][] = [];

  for (let row = 0; row < height; row++) {
    const pixelRow: Color[] = [];
    for (let col = 0; col < width; col++) {
      const red = parseInt(tokens[index++]!, 10);
      const green = parseInt(tokens[index++]!, 10);
      const blue = parseInt(tokens[index++]!, 10);
      pixelRow.push({ red, green, blue });
    }
    pixels.push(pixelRow);
  }

  return {
    width,
    height,
    pixels,
  };
};

// Writes an Image object to a PPM P3 file
const writeImage = (image: Image, filename: string): void => {
  let content = "P3\r\n";
  content += `${image.width} ${image.height}\r\n`;
  content += `255\r\n`;

  for (let row = 0; row < image.height; row++) {
    for (let col = 0; col < image.width; col++) {
      const pixel: Color = image.pixels[row]![col]!;
      content += `${col === 0 ? "" : " "}${pixel.red} ${pixel.green} ${pixel.blue}`;
    }
    content += `\r\n`;
  }

  writeFileSync(filename, content, "utf-8");
};

const usage = (): void => {
  console.log(
    "USAGE: npm start -- <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}",
  );
};

const grayscale = (image: Image, outFile: string): void => {
  for (let row = 0; row < image.height; row++) {
    for (let col = 0; col < image.width; col++) {
      const curColor = image.pixels[row]![col]!;

      const grayLevel = Math.max(
        0,
        Math.min(
          Math.floor((curColor.red + curColor.green + curColor.blue) / 3),
          255,
        ),
      );

      curColor.red = grayLevel;
      curColor.green = grayLevel;
      curColor.blue = grayLevel;
    }
  }

  writeImage(image, outFile);
  console.log(`Grayscale image saved to ${outFile}`);
};

const invert = (image: Image, outFile: string): void => {
  for (let row = 0; row < image.height; row++) {
    for (let col = 0; col < image.width; col++) {
      const curColor = image.pixels[row]![col]!;
      
      curColor.red = 255 - curColor.red;  
      curColor.green = 255 - curColor.green;
      curColor.blue = 255 - curColor.blue;
    }
  }

  writeImage(image, outFile);
  console.log(`Inverted image saved to ${outFile}`);
};

const emboss = (image: Image, outFile: string): void => {
  for (let col = image.width - 1; col >= 0; --col) {
    for (let row = image.height - 1; row >= 0; --row) {
      const curColor = image.pixels[row]![col]!;
      
      let diff = 0;
      if (col > 0 && row > 0) {
        const upLeftColor = image.pixels[row - 1]![col - 1]!;
        if (Math.abs(curColor.red - upLeftColor.red) > Math.abs(diff)) {
          diff = curColor.red - upLeftColor.red;
        }
        if (Math.abs(curColor.green - upLeftColor.green) > Math.abs(diff)) {
          diff = curColor.green - upLeftColor.green;
        }
        if (Math.abs(curColor.blue - upLeftColor.blue) > Math.abs(diff)) {
          diff = curColor.blue - upLeftColor.blue;
        }
      }
      
      let grayLevel = 128 + diff;
      grayLevel = Math.max(0, Math.min(grayLevel, 255));
      
      curColor.red = grayLevel;
      curColor.green = grayLevel;
      curColor.blue = grayLevel;
    }
  }
  
  writeImage(image, outFile);
  console.log(`Emboss image saved to ${outFile}`);
};

const motionblur = (image: Image, outFile: string, length: number): void => {
  if (length < 1) {
    writeImage(image, outFile);
    console.log(`Motion blur image saved to ${outFile}`);
    return;
  }

  for (let col = 0; col < image.width; col++) {
    for (let row = 0; row < image.height; row++) {
      const curColor = image.pixels[row]![col]!;
      
      const maxCol = Math.min(image.width - 1, col + length - 1);
      for (let i = col + 1; i <= maxCol; i++) {
        const tmpColor = image.pixels[row]![i]!;
        curColor.red += tmpColor.red;
        curColor.green += tmpColor.green;
        curColor.blue += tmpColor.blue;
      }

      const delta = maxCol - col + 1;
      curColor.red = Math.floor(curColor.red / delta);
      curColor.green = Math.floor(curColor.green / delta);
      curColor.blue = Math.floor(curColor.blue / delta);
    }
  }
  
  writeImage(image, outFile);
  console.log(`Motion blur image saved to ${outFile}`);
};

main();
