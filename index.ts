import mammoth from "mammoth";
import * as fs from "fs";
import * as A from "fp-ts/lib/Array";
import { pipe, flow } from "fp-ts/lib/function";
import { AWS } from "./AWS.config";
import { uploadToDb } from "./updateToDb";

const s3 = new AWS.S3();

type Node = any;

const addAltTextToImages = (title: string) => (nodes: Node[]) => {
  return A.array
    .mapWithIndex(nodes, (i, node: Node) => {
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

const writeImages = (nodes: Node[]) => {
  return A.array.map(nodes, (node) => {
    if (node.type === "image") {
      node.read().then((data: string | Buffer) => {
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

const getChildren = ({ children }: { children: Node[] }) => children;

const flattenChildren = flow(
  getChildren,
  A.map(getChildren),
  A.flatten,
  A.map(getChildren),
  A.map(
    A.reduceWithIndex([] as Node[], (i, acc, node: Node) => {
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

function jsonFromDocx(title: string | undefined) {
  if (!title) {
    console.log(`
    Pass in the title of the docx file you want to parse.
    For example, pass in \`fileToBeParsed\` to parse './fileToBeParsed.docx'
    `);

    return;
  }

  type Document = any;

  const transformDocument = (document: Document) => {
    pipe(
      document,
      flattenChildren,
      addAltTextToImages(title),
      writeImages,
      (arr) => ({ title, html: arr }),
      uploadToDb
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
    .catch(({ message }: Error) => console.log(message));
}

jsonFromDocx(process.argv.slice(2).join(" "));
