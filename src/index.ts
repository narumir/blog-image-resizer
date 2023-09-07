import sharp from "sharp";
import {
  APIGatewayProxyHandler,
} from "aws-lambda";
import {
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const handler: APIGatewayProxyHandler = async (event) => {
  const width: number | undefined = parseInt(event.queryStringParameters?.width || "", 10) || undefined;
  const quality: number | undefined = parseInt(event.queryStringParameters?.quality || "", 10) || undefined;
  const key: string = (event.pathParameters?.proxy ?? "").split(".")[0];
  const client = new S3Client({ region: process.env.REGION });
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET,
    Key: key,
  });
  try {
    const res = await client.send(command);
    if (res.Body == null) {
      throw new Error("file not found");
    }
    const body = await res.Body.transformToByteArray()
    const buffer = await sharp(body)
      .rotate()
      .resize({ width })
      .webp({ quality })
      .toBuffer();
    return {
      headers: {
        "Content-Type": "image/webp"
      },
      statusCode: 200,
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: "",
    };
  }
};
