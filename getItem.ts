import { AWS } from "./AWS.config";
import axios from "axios";

const db = new AWS.DynamoDB();

const getTitles = () => {
  db.scan(
    {
      TableName: "pjk-art-series",
      Limit: 1000,
      ProjectionExpression: ["title", "id"].join(", "),
      FilterExpression:
        "installmentId = :installmentId and attribute_exists(title)",
      ExpressionAttributeValues: {
        ":installmentId": { S: "Juan de Pareja" },
      },
    },
    (err, data) => console.log(err || data)
  );
};

getTitles();
