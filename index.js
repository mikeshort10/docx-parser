const mammoth = require("mammoth");
const fs = require("fs");
const A = require("fp-ts/lib/Array");
const { pipe, flow } = require("fp-ts/lib/function");
const { AWS } = require("./AWS.config");

const s3 = new AWS.S3();

const addAltTextToImages = (title) => (nodes) => {
  return A.array
    .mapWithIndex(nodes, (i, node) => {
      if (node.type === "image") {
        const altText = nodes[i + 1].value;
        const fileExtension = node.contentType.split("/")[1];

        nodes.splice(i + 1, 1);

        return {
          ...node,
          altText,
          src: `${title}_${altText}.${fileExtension}`,
        };
      }
      return node;
    })
    .filter(Boolean);
};

const writeImages = (nodes) => {
  return A.array.map(nodes, (node) => {
    if (node.type === "image") {
      node.read().then((data) => {
        fs.writeFileSync(`./output/${node.src}`, data);
        s3.putObject(
          {
            Body: data,
            Bucket: "pjk-art-series",
            Key: node.src,
            ContentType: node.contentType,
          },
          console.log
        );
      });
    }
    return node;
  });
};

const getChildren = ({ children }) => children;

const flattenChildren = flow(
  getChildren,
  A.map(getChildren),
  A.flatten,
  A.map(getChildren),
  A.map(
    A.reduce([], (acc, node, i) => {
      const lastInRun = acc[i - 1];
      if (lastInRun && lastInRun.type === "text" && node.type === "text") {
        lastInRun.value += node.value;
        return acc;
      }
      return [...acc, node];
    })
  ),
  A.flatten
);

function jsonFromDocx(title) {
  if (!title) {
    console.log(`
    Pass in the title of the docx file you want to parse.
    For example, pass in \`fileToBeParsed\` to parse './fileToBeParsed.docx'
    `);

    return;
  }

  const transformDocument = (document) => {
    pipe(
      document,
      flattenChildren,
      addAltTextToImages(title),
      writeImages,
      (arr) =>
        fs.writeFileSync(
          `output/${title}.js`,
          `export default ${JSON.stringify({ title, html: arr })}`
        )
    );
    return document;
  };

  mammoth
    .convertToHtml(
      {
        path: `./input/${title}.docx`,
        ignoreEmptyParagraphs: true,
        // convertImage: mammoth.images.imgElement(function (image) {
        //   return image.read("base64").then(function (imageBuffer) {
        //     return {
        //       src: "data:" + image.contentType + ";base64," + imageBuffer,
        //     };
        //   });
        // }),
      },
      { transformDocument }
    )
    .catch((e) => console.log(e.message));
}

jsonFromDocx(process.argv.slice(2).join(" "));
