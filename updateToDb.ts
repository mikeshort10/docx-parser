const { AWS } = require("./AWS.config");
import * as A from "fp-ts/lib/Array";
import { v4 as uuidv4 } from "uuid";

const dbClient = new AWS.DynamoDB.DocumentClient();

type Block = {
  type: string;
  altText?: string;
  contentType?: string;
  src?: string;
  value?: string;
};

const getDescription = A.reduce("", (acc, { value }: Block) => {
  return acc.length > 150 || !(value || "").trim() ? acc : `${acc} ${value}`;
});

export const uploadToDb = (
  installmentNumber: number,
  publishedOn = new Date(),
  series = 2
) => ({ title, html }: { title: string; html: Block[] }) => {
  const installmentId = uuidv4();

  const installment: Record<string, any> = {
    PutRequest: {
      Item: {
        installmentId,
        id: installmentId,
        title,
        description: getDescription(html),
        createdOn: new Date().toISOString(),
        publishedOn: new Date(publishedOn).toISOString(),
        series,
        installmentNumber,
      },
    },
  };

  const updates = A.array.reduceWithIndex(
    html,
    [installment],
    (order, acc, { value, type, ...rest }) => {
      const val = value ? { val: value } : {};
      const uuid = uuidv4();

      return [
        ...acc,
        {
          PutRequest: {
            Item: {
              ...rest,
              ...val,
              order,
              blockType: type,
              installmentId,
              id: `${type}:${uuid}`,
            },
          },
        },
      ];
    }
  );

  for (let i = 0; i < updates.length; i += 25) {
    dbClient.batchWrite(
      {
        RequestItems: {
          "pjk-art-series": updates.slice(i, i + 25),
        },
      },
      (err: Error, data: any): void => err && console.log(err)
    );
  }

  console.log("🔗: ", "https://pjk.netlify.app");
};
