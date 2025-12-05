from .interface import InputVectorBuilder
from ..utils import (
    normalize_vocab_factor,
    normalize_interaction_factor,
    normalize_understanding_factor,
    normalize_speed_factor
)

class NormalizedInputVectorBuilder(InputVectorBuilder):
    def __init__(self, db, feedback):
        self.db = db
        self.feedback = feedback
        self.vector = [0] * 6   # pause, rewind, vlookup, vsave, understanding, speed

    def buildVocabPart(self):
        vl, vs = normalize_vocab_factor(
            db=self.db,
            generated_content_id=self.feedback.generated_content_id,
            vocab_lookup_cnt=self.feedback.vocab_lookup_cnt,
            vocab_save_cnt=self.feedback.vocab_save_cnt
        )
        self.vector[2] = vl
        self.vector[3] = vs

    def buildInteractionPart(self):
        pause, rewind = normalize_interaction_factor(
            pause_cnt=self.feedback.pause_cnt,
            rewind_cnt=self.feedback.rewind_cnt
        )
        self.vector[0] = pause
        self.vector[1] = rewind

    def buildUnderstandingPart(self):
        self.vector[4] = normalize_understanding_factor(
            understanding_difficulty=self.feedback.understanding_difficulty
        )

    def buildSpeedPart(self):
        self.vector[5] = normalize_speed_factor(
            speed_difficulty=self.feedback.speed_difficulty
        )

    def getVector(self):
        return self.vector
