from voxcpm import VoxCPM
from . import config

def load_voxcpm_model():
    """
    Load VoxCPM model once at startup.
    """
    model = VoxCPM.from_pretrained(config.MODEL_NAME)
    return model