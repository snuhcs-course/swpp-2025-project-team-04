import boto3
import os
import io
from dotenv import load_dotenv
import uuid

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def generate_s3_object_key(ext: str = "mp3") -> str:

    key = f"audio/{uuid.uuid4()}.{ext}" # make key name using UUID

    return key


def generate_example_audio_key(ext: str = "mp3") -> str:
    """
    Generate a unique S3 object key for example sentence audios.
    Stored under the prefix 'audio/examples/'.
    """
    key = f"audio/examples/{uuid.uuid4()}.{ext}"
    return key


def upload_audio_to_s3(audio_bytes: bytes, key: str) -> str:
    s3_client.upload_fileobj(
        io.BytesIO(audio_bytes),
        AWS_S3_BUCKET,
        key,
        ExtraArgs={"ContentType": "audio/mpeg"},
    )
    return f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"