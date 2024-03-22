import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const awardBody = event.pathParameters?.awardBody;
    const movieId = event.pathParameters?.movieId
      ? parseInt(event.pathParameters.movieId)
      : undefined;

    if (!awardBody || !movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "missing movieid or awards" }),
      };
    }

    const queryCommandOutput = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.AWARDS_TABLE_NAME,
        KeyConditionExpression: "#awardBody = :awardBody AND movieId = :movieId",
        ExpressionAttributeNames: {
          "#awardBody": "awardBody",
        },
        ExpressionAttributeValues: {
          ":awardBody": awardBody,
          ":movieId": movieId,
        },
      })
    );

    if (!queryCommandOutput.Items || queryCommandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "no award" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data: queryCommandOutput.Items }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "ERROR" }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}