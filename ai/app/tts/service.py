
import json
import base64
import numpy as np
from ..core import config
from ..core.logger import get_logger
from .utils import pcm_to_wav_bytes
from ..referenced_voice.reference import SPEAKER_REFERENCES

logger = get_logger(__name__)


def dialogue_stream_generator(model, sentences: list, silence_len: float = 0.0):
    """
    Generate streaming response for TTS dialogue.
    Each packet is a JSON line containing base64-encoded audio.
    """
    

    for idx, sentence_object in enumerate(sentences):
        try:
            text = sentence_object.get("text", "")
            voice_id = sentence_object.get("voice_id", "default")
            referenced_voice = SPEAKER_REFERENCES.get(voice_id) # TODO : voice matching

            if not referenced_voice:
                raise ValueError(f"Unknown voice_id: {voice_id}")

            logger.info(f"[TTS] Generating: idx={idx}, voice_id={voice_id}, text='{text[:40]}...'")

            # --- pcm generation via model ---
            pcm = model.generate(
                text=text,
                cfg_value=2.0,
                inference_timesteps=config.INFERENCE_TIMESTAMP, 
                normalize=True,
                denoise=True,
                retry_badcase=True,
                retry_badcase_max_times=3,
                retry_badcase_ratio_threshold=6.0,
                prompt_wav_path=referenced_voice["prompt_wav_path"], # referenced voice audio for voice-cloning
                prompt_text=referenced_voice["prompt_text"],  # referenced voice audio's script for voice-cloning
            ).astype(np.float32)

            

            # --- PCM → WAV ---
            wav_bytes = pcm_to_wav_bytes(pcm)


            packet = {
                "audio_base64": base64.b64encode(wav_bytes).decode("utf-8"),
                "voice_id": voice_id,
                "text": text,
                "num_samples": len(pcm),
                "sample_rate": config.SAMPLE_RATE,
            }

            # go to the stream 
            yield (json.dumps(packet) + "\n").encode("utf-8")

            # --- silence between sentences ---
            if idx < len(sentences) - 1 and silence_len > 0:
                silence_samples = int(silence_len * config.SAMPLE_RATE)
                silence_pcm = np.zeros(silence_samples, dtype=np.float32)
                silence_wav = pcm_to_wav_bytes(silence_pcm)

                silence_packet = {
                    "audio_base64": base64.b64encode(silence_wav).decode("utf-8"),
                    "voice_id": "silence",
                    "text": "",
                    "num_samples": len(silence_pcm),
                    "sample_rate": config.SAMPLE_RATE,
                }
                # go to the stream 
                yield (json.dumps(silence_packet) + "\n").encode("utf-8")

        except Exception as e:
            logger.exception(f"Error generating TTS segment idx={idx}: {e}")
            error_packet = {"error": str(e), "index": idx}
            yield (json.dumps(error_packet) + "\n").encode("utf-8")

    logger.info("[TTS] Streaming generation completed.")


