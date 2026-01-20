import sharp from "sharp";

const args = process.argv.slice(2);

const main = (): void => {
  //   console.log(args);

  if (args.length < 3 || args.length >= 5) {
    usage();
    process.exit(1);
  }

  const inFile = args[0];
  const outFile = args[1];
  const image = sharp(args[2]);

  switch (args[2]) {
    case "grayscale":
      console.log("grayscale");
      break;
    case "invert":
      console.log("invert");
      break;
    case "emboss":
      console.log("emboss");
      break;
    case "motionblur":
      const motionBlurLength: number = Number(args[3]);
      if (args.length !== 4 || typeof motionBlurLength === "number") {
        usage();
        process.exit(1);
      }

      console.log("motionblur", motionBlurLength);
      break;
    default:
      usage();
      process.exit(1);
  }
};

const usage = (): void => {
  console.log(
    "USAGE: npm start -- <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}",
  );
};

main();
