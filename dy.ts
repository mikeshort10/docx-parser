const { AWS } = require("./AWS.config");
import * as A from "fp-ts/lib/Array";
import * as R from "fp-ts/lib/Record";
import juan from "./output/Juan de Pareja";

const db = new AWS.DynamoDB();

const ddbString = (S: string) => ({ S });

type Block = {
  type: string;
  altText?: string;
  contentType?: string;
  src?: string;
  value?: string;
};

const createItems = (blocks: Block[]) => {
  return A.array.mapWithIndex(blocks, (id, { value, ...rest }) => {
    const val = value ? { val: ddbString(value) } : {};
    const rec = R.record.reduceWithIndex(
      rest as Record<string, any>,
      { ...val } as Record<string, any>,
      (key, acc, value: string) => {
        return {
          ...acc,
          installmentId: ddbString("1"),
          id: ddbString("5"),
          [key]: ddbString(value),
        };
      }
    );
    return {
      PutRequest: {
        Item: rec,
      },
    };
  });
};

const [
  {
    PutRequest: {
      Item: { type, ...Item },
    },
  },
] = createItems([
  {
    type: "text",
    value: "We return to Espana.",
  },
]);

console.log(JSON.stringify(Item));

db.putItem(
  { TableName: "pjk-art-series", Item: { ...Item, ty: type } },
  (err: Error) => console.log(err)
);

// db.batchWrite(
//   {
//     RequestItems: {
//       "pjk-art-series": updates,
//     },
//   },
//   (err: Error) => {
//     err ? console.log(err) : console.log("success");
//   }
// );

// db.batchWrite(
//   {
//     TableName: "pjk-art-series",
//     ProjectionExpression: "val",
//     // IndexName: "title",
//     // KeyConditionExpression: "#title = :title",
//     // ExpressionAttributeValues: {
//     //   ":title": "Dali",
//     //   // ":sid": "1",
//     // },
//     // Key: {
//     //   pid: { S: {} },
//     //   sid: { S: "1:3" },
//     // },
//   },

//   (err, data) => {
//     console.log(err || data);
//   }
// );

// db.putItem(
//   {
//     TableName: "pjk-art-series",
//     Item: {
//       pid: { S: "4" },
//       sid: { S: "1:3" },
//       title: { S: "Dali" },
//       // type: { S: "text" },
//       // value: { S: "Hello DynamoDB! Nice to meet ya!" },
//     },
//   },
//   (err, data) => {
//     console.log(err, data);
//   }
// );
