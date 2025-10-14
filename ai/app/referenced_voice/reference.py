import os

# 현재 py 파일이 있는 디렉터리 경로
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SPEAKER_REFERENCES = {
    "ref_voice_1": {
        "prompt_wav_path": os.path.join(BASE_DIR, "ref_voice_1.wav"),
        "prompt_text": "From video calls to instant messages, distance feels smaller than it used to."
    },
    "ref_voice_2": {
        "prompt_wav_path": os.path.join(BASE_DIR, "ref_voice_2.wav"),
        "prompt_text": "Good morning everyone, and welcome to today’s session."
    }
}