import logging
import sys


def get_logger(name: str) -> logging.Logger:
    """
    Return a configured logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.propagate = False

    return logger
