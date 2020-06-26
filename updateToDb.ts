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

export const uploadToDb = ({
  title,
  html,
}: {
  title: string;
  html: Block[];
}) => {
  const installmentId = uuidv4();
  const reducerInitializer: any[] = [
    { PutRequest: { Item: { installmentId, id: installmentId, title } } },
  ];
  const updates = A.array.reduceWithIndex(
    html,
    reducerInitializer,
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
      { RequestItems: { "pjk-art-series": updates.slice(i, i + 25) } },
      (err: Error, data: any) => console.log(err || data)
    );
  }
};
