const db = require("./db");

const {
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");

const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const getPost = async (event) => {
  const response = { statusCode: 200 };
  console.log("event:: ", event);
  console.log("event post id:: ", event.pathParameters.postId);
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: event.pathParameters.postId }),
    };
    console.log("Params: ", params);
    const body = await db.send(new GetItemCommand(params));
    item = body.Item;
    console.log("Item:: ", body);
    response.body = JSON.stringify({
      message: "Success",
      data: item ? unmarshall(item) : {},
    });
  } catch (e) {
    console.error(" Error from get Post ", e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to get post.",
      errorMessage: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

const createPost = async (event) => {
  const response = { statusCode: 200 };

  try {
    const requestBody = JSON.parse(event.body);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(requestBody || {}),
    };

    const createResult = await db.send(new PutItemCommand(params));

    console.log("Created Item:: ", { createResult });
    response.body = JSON.stringify({
      message: "Successfully Created Post",
      createResult,
    });
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to create post.",
      errorMessage: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

const updatePost = async (event) => {
  const response = { statusCode: 200 };

  try {
    const requestBody = JSON.parse(event.body);
    const objKeys = Object.keys(requestBody);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: event.pathParameters.postId }),
      UpdateExpression: `SET ${objKeys.map(
        (_, index) => `#key${index} = :value${index}`
      )}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
          }),
          {}
        )
      ),
    };

    const updateResult = await db.send(new UpdateItemCommand(params));

    console.log("updated result:: ", { updateResult });
    response.body = JSON.stringify({
      message: "Successfully Updated Post",
      updateResult,
    });
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to update post.",
      errorMessage: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

const deletePost = async (event) => {
  const response = { statusCode: 200 };

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: event.pathParameters.postId }),
    };

    const deleteResult = await db.send(new DeleteItemCommand(params));

    response.body = JSON.stringify({
      message: "Successfully Deleted Post",
      deleteResult,
    });
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to delete post.",
      errorMessage: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

const getAllPosts = async (event) => {
  const response = { statusCode: 200 };

  try {
    const allItems = await db.send(
      new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME })
    );
    let items = allItems.Items;
    response.body = JSON.stringify({
      message: "Successfully retrieved all Post",
      data: items ? items.map((item) => unmarshall(item)) : [],
    });
    console.log("response items:: ", response);
  } catch (e) {
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to get all post.",
      errorMessage: e.message,
      errorStack: e.stack,
    });
  }

  return response;
};

module.exports = {
  getPost,
  createPost,
  updatePost,
  deletePost,
  getAllPosts,
};
