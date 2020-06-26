"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
exports.__esModule = true;
var AWS = require("./AWS.config").AWS;
var A = require("fp-ts/lib/Array");
var R = require("fp-ts/lib/Record");
var Juan_de_Pareja_1 = require("./output/Juan de Pareja");
var db = new AWS.DynamoDB.DocumentClient();
var ddbString = function (S) { return ({ S: S }); };
var createItems = function (blocks) {
    return A.array.map(blocks, function (_a) {
        var value = _a.value, rest = __rest(_a, ["value"]);
        var val = value ? { val: ddbString(value) } : {};
        var rec = R.record.reduceWithIndex(rest, __assign({}, val), function (key, acc, value) {
            var _a;
            return __assign({}, acc, (_a = {}, _a[key] = ddbString(value), _a));
        });
        return {
            PutRequest: {
                Item: rec
            }
        };
    });
};
console.log(A.array.map(Juan_de_Pareja_1["default"].html, function (block) { return block; }));
// const updates = createItems(juan.html);
// console.log(updates);
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
