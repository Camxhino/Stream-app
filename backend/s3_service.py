import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def generate_presigned_upload_url(file_name: str, file_type: str, expiration: int = 3600) -> dict:
    """
    Genera una URL prefirmada para que el cliente pueda subir un archivo directamente a S3.
    """
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': file_name,
                'ContentType': file_type
            },
            ExpiresIn=expiration
        )
        
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_name}"
        
        return {
            "upload_url": response,
            "file_url": file_url
        }
    except ClientError as e:
        print(f"Error al generar la URL prefirmada: {e}")
        return None