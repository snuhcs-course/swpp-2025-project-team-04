from __future__ import annotations

from io import BytesIO

from app.core import s3setting


def test_generate_s3_keys_unique():
    key = s3setting.generate_s3_object_key("wav")
    assert key.startswith("audio/") and key.endswith(".wav")

    example_key = s3setting.generate_example_audio_key("mp3")
    assert example_key.startswith("audio/examples/")


def test_upload_audio_to_s3(monkeypatch):
    calls = {}

    class DummyClient:
        def upload_fileobj(self, fileobj, bucket, key, ExtraArgs=None):
            calls["bucket"] = bucket
            calls["key"] = key
            assert isinstance(fileobj, BytesIO)

    monkeypatch.setattr(s3setting, "s3_client", DummyClient())
    monkeypatch.setattr(s3setting, "AWS_S3_BUCKET", "test-bucket")
    monkeypatch.setattr(s3setting, "AWS_REGION", "local")

    url = s3setting.upload_audio_to_s3(b"audio-bytes", "audio/demo.mp3")
    assert "test-bucket" in url
    assert calls["key"] == "audio/demo.mp3"
