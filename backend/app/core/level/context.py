from .strategy import LevelServiceStrategy
from ..logger import logger

class LevelContext:
    def __init__(self, strategy: LevelServiceStrategy):
        self.strategy = strategy
        logger.info(f"LevelContext initialized with strategy: {strategy.__class__.__name__}")

    def set_strategy(self, strategy: LevelServiceStrategy):
        logger.info(f"Changing strategy to: {strategy.__class__.__name__}")
        self.strategy = strategy

    def evaluate_level_test(self, db, user, payload):
        logger.info(f"evaluate_level_test called for user_id={user.id}")
        result = self.strategy.evaluate_level_test(db, user, payload)
        logger.info(f"evaluate_level_test completed for user_id={user.id}, result: {result}")
        return result

    def evaluate_session_feedback(self, db, user, payload):
        logger.info(f"evaluate_session_feedback called for user_id={user.id}, generated_content_id={payload.generated_content_id}")
        result = self.strategy.evaluate_session_feedback(db, user, payload)
        logger.info(f"evaluate_session_feedback completed for user_id={user.id}")
        return result

    def set_manual_level(self, db, user, payload):
        logger.info(f"set_manual_level called for user_id={user.id}, target_level={payload.level}")
        result = self.strategy.set_manual_level(db, user, payload)
        logger.info(f"set_manual_level completed for user_id={user.id}")
        return result