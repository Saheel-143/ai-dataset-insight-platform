"""
Storage Service with Dual-Mode Support:
- Local filesystem storage (default for zero-budget local development)
- AWS S3 storage (production mode via boto3 and presigned URLs)
"""
import os
import io
import uuid
import shutil
import pandas as pd
from typing import Tuple, Optional, BinaryIO

class StorageService:
    def __init__(self):
        self.mode = os.environ.get("STORAGE_MODE", "local").lower()
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        self.uploads_dir = os.path.join(self.base_dir, "uploads")
        self.cleaned_dir = os.path.join(self.base_dir, "cleaned")
        self.reports_dir = os.path.join(self.base_dir, "reports")
        self.sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_data"))

        os.makedirs(self.uploads_dir, exist_ok=True)
        os.makedirs(self.cleaned_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)

        self.s3_bucket = os.environ.get("AWS_S3_BUCKET_NAME", "ai-dataset-insight-bucket")
        self.s3_client = None

        if self.mode == "s3":
            try:
                import boto3
                self.s3_client = boto3.client("s3")
            except Exception as e:
                print(f"[StorageService] Failed to initialize S3 client: {e}. Falling back to local.")
                self.mode = "local"

    def save_upload(self, file_content: bytes, filename: str, is_cleaned: bool = False) -> Tuple[str, str]:
        """
        Saves file bytes to either local storage or S3.
        Returns (storage_key, relative_or_s3_path)
        """
        ext = os.path.splitext(filename)[1].lower()
        file_id = str(uuid.uuid4())
        stored_filename = f"{file_id}{ext}"

        if self.mode == "s3" and self.s3_client:
            prefix = "cleaned/" if is_cleaned else "uploads/"
            s3_key = f"{prefix}{stored_filename}"
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=s3_key,
                Body=file_content,
                Metadata={"original_filename": filename}
            )
            return s3_key, s3_key
        else:
            target_dir = self.cleaned_dir if is_cleaned else self.uploads_dir
            file_path = os.path.join(target_dir, stored_filename)
            with open(file_path, "wb") as f:
                f.write(file_content)
            return stored_filename, file_path

    def load_dataframe(self, storage_key: str, filename: str) -> pd.DataFrame:
        """
        Loads dataset into a Pandas DataFrame from local storage or S3.
        """
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = os.path.splitext(storage_key)[1].lower()

        if self.mode == "s3" and self.s3_client:
            response = self.s3_client.get_object(Bucket=self.s3_bucket, Key=storage_key)
            content = response["Body"].read()
            buffer = io.BytesIO(content)
            if ext in [".xlsx", ".xls"]:
                return pd.read_excel(buffer, engine="openpyxl" if ext == ".xlsx" else None)
            else:
                return pd.read_csv(buffer)
        else:
            # Check uploads, cleaned, or sample_data
            candidate_paths = [
                os.path.join(self.uploads_dir, storage_key),
                os.path.join(self.cleaned_dir, storage_key),
                os.path.join(self.sample_dir, storage_key),
                os.path.join(self.sample_dir, filename),
                storage_key # if absolute path
            ]
            found_path = None
            for p in candidate_paths:
                if os.path.exists(p) and os.path.isfile(p):
                    found_path = p
                    break

            if not found_path:
                raise FileNotFoundError(f"Dataset file not found for storage key: {storage_key} or filename: {filename}")

            if ext in [".xlsx", ".xls"]:
                return pd.read_excel(found_path, engine="openpyxl" if ext == ".xlsx" else None)
            else:
                # Try UTF-8 then fallback to latin-1
                try:
                    return pd.read_csv(found_path, encoding="utf-8")
                except UnicodeDecodeError:
                    return pd.read_csv(found_path, encoding="latin-1")

    def save_dataframe(self, df: pd.DataFrame, filename: str, is_cleaned: bool = True) -> Tuple[str, str, int]:
        """
        Saves a DataFrame to disk/S3 as CSV or Excel.
        Returns (storage_key, file_path_or_key, file_size_bytes)
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".csv", ".xlsx"]:
            ext = ".csv"

        file_id = str(uuid.uuid4())
        stored_filename = f"{file_id}{ext}"

        if ext == ".xlsx":
            buffer = io.BytesIO()
            df.to_excel(buffer, index=False, engine="openpyxl")
            data = buffer.getvalue()
        else:
            data = df.to_csv(index=False).encode("utf-8")

        storage_key, path = self.save_upload(data, stored_filename, is_cleaned=is_cleaned)
        return storage_key, path, len(data)

    def get_download_url(self, storage_key: str, original_filename: str) -> str:
        """
        Generates presigned URL for S3 or local download endpoint.
        """
        if self.mode == "s3" and self.s3_client:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.s3_bucket,
                    "Key": storage_key,
                    "ResponseContentDisposition": f'attachment; filename="{original_filename}"'
                },
                ExpiresIn=3600
            )
        else:
            return f"/api/datasets/download/{storage_key}?filename={original_filename}"

    def get_presigned_upload_url(self, filename: str) -> dict:
        """
        Generates presigned upload URL for direct S3 upload or local endpoint details.
        """
        ext = os.path.splitext(filename)[1].lower()
        file_id = str(uuid.uuid4())
        storage_key = f"uploads/{file_id}{ext}"

        if self.mode == "s3" and self.s3_client:
            presigned_post = self.s3_client.generate_presigned_post(
                Bucket=self.s3_bucket,
                Key=storage_key,
                Fields={"acl": "private"},
                Conditions=[
                    {"acl": "private"},
                    ["content-length-range", 10, 50 * 1024 * 1024]  # Max 50MB
                ],
                ExpiresIn=3600
            )
            return {
                "upload_mode": "s3",
                "storage_key": storage_key,
                "url": presigned_post["url"],
                "fields": presigned_post["fields"]
            }
        else:
            return {
                "upload_mode": "local",
                "storage_key": f"{file_id}{ext}",
                "url": "/api/datasets/upload"
            }

    def delete_file(self, storage_key: str):
        if self.mode == "s3" and self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=self.s3_bucket, Key=storage_key)
            except Exception as e:
                print(f"[StorageService] Failed to delete S3 object: {e}")
        else:
            for d in [self.uploads_dir, self.cleaned_dir, self.reports_dir]:
                p = os.path.join(d, storage_key)
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception as e:
                        print(f"[StorageService] Failed to remove local file: {e}")

# Global singleton
storage_service = StorageService()

