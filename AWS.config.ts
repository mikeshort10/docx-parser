import AWS from "aws-sdk";
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY,
  secretAccessKey: process.env.MY_AWS_SECRET_KEY,
  region: "us-east-1",
});

export { AWS };
