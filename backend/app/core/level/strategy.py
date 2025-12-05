from abc import ABC, abstractmethod

class LevelServiceStrategy(ABC):

    @abstractmethod
    def evaluate_level_test(self, db, user, payload):
        pass

    @abstractmethod
    def evaluate_session_feedback(self, db, user, payload):
        pass

    @abstractmethod
    def set_manual_level(self, db, user, payload):
        pass