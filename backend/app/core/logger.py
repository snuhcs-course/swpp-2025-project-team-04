import logging

logger = logging.getLogger("audio_service")
logger.setLevel(logging.INFO)

formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s")

console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)