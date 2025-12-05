from ...core.level.strategy import LevelServiceStrategy
from .service import LevelManagementService

class AILevelManagementStrategy(LevelServiceStrategy):
    def __init__(self):
        self.service = LevelManagementService() 

    def evaluate_level_test(self, db, user, payload):
        return self.service.evaluate_initial_level(db, user, payload)

    def evaluate_session_feedback(self, db, user, payload):
        return self.service.evaluate_session_feedback(db, user, payload)

    def set_manual_level(self, db, user, payload):
        return self.service.set_manual_level(db, user, payload)
