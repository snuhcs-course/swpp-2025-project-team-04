from voxcpm import VoxCPM
from . import config
from .logger import get_logger

logger = get_logger(__name__)

def load_voxcpm_model():
    try:
        logger.info(f"Loading model: {config.MODEL_NAME}")
        model = VoxCPM.from_pretrained(config.MODEL_NAME)
        logger.info("VoxCPM model loaded successfully.")
        return model
    except Exception as e:
        logger.exception("Failed to load VoxCPM model.")
        raise e