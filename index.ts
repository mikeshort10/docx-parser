import mammoth from "mammoth";
import * as fs from "fs";
import * as A from "fp-ts/lib/Array";
import { pipe, flow } from "fp-ts/lib/function";
import { AWS } from "./AWS.config";
import { uploadToDb } from "./updateToDb";

const s3 = new AWS.S3();

type Node = any;

const getAltTextAndCaption = (
  nodes: Node[],
  i: number
): { altText: string; noCaption?: true } => {
  const altTextBlock: { value?: string } = nodes[i + 1];
  const altTextIndicator = "{{{noCaption}}}";
  if (altTextBlock == null || altTextBlock.value == null) {
    console.info(`

    Image ${i} missing alt text

    `);
    return { altText: `image_${i}`, noCaption: true };
  } else {
    nodes.splice(i + 1, 1);
  }
  const { groups } = altTextBlock.value.match(/^{{{(?<altText>.+)}}}$/) || [];
  if (groups?.altText != null) {
    return { altText: groups?.altText, noCaption: true };
  }
  return { altText: altTextBlock.value };
};

const addAltTextToImages = (title: string) => (nodes: Node[]) => {
  return A.array
    .mapWithIndex(
      nodes,
      (i, node: Node): Node => {
        if (node.type !== "image") {
          return node;
        }
        const altTextAndCaption = getAltTextAndCaption(nodes, i);
        const fileExtension = node.contentType.split("/")[1];

        return {
          ...node,
          ...altTextAndCaption,
          src: `${title}_${altTextAndCaption.altText}.${fileExtension}`,
        };
      }
    )
    .filter(({ type, value }) => type !== "text" || value.trim()) // remove empty text
    .filter(({ type }) => ["break"].includes(type) === false) // remove line breaks
    .filter(Boolean);
};

const writeImages = (nodes: Node[]) => {
  return A.array.map(nodes, (node) => {
    if (node.type === "image") {
      node.read().then((data: string | Buffer) => {
        s3.putObject(
          {
            Body: data,
            Bucket: "pjk-art-series",
            Key: node.src,
            ContentType: node.contentType,
          },
          (err) => err && console.log(err)
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

function jsonFromDocx(
  path: string | undefined,
  installmentNumber: string,
  dateString: string
) {
  if (!path) {
    console.log(`
    Pass in the absolute path of the file you want to parse
    `);

    return;
  } else if (
    new Date(dateString).toString() == "Invalid Date" ||
    dateString.includes(" ") === false
  ) {
    console.log(`
      Invalid Date String
    `);
    return;
  }
  const dirNames = path.split("/");
  const title = dirNames[dirNames.length - 1]
    .slice(0, -5) // remove .docx
    .replace(/\(\d+\)/gi, "")
    .trim();
  type Document = any;

  const transformDocument = (document: Document) => {
    pipe(
      document,
      flattenChildren,
      addAltTextToImages(title),
      writeImages,
      (arr) => ({ title, html: arr }),
      uploadToDb(+installmentNumber, new Date(dateString))
    );
    return document;
  };

  mammoth
    .convertToHtml(
      {
        path,
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

const [path, installmentNumber, dateString] = process.argv.slice(2);

jsonFromDocx(path, installmentNumber, dateString);
