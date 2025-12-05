from .interface import InputVectorBuilder

class RawInputVectorBuilder(InputVectorBuilder):
    def __init__(self, feedback):
        self.feedback = feedback
        self.vector = [0] * 6

    def buildVocabPart(self):
        self.vector[2] = self.feedback.vocab_lookup_cnt
        self.vector[3] = self.feedback.vocab_save_cnt

    def buildInteractionPart(self):
        self.vector[0] = self.feedback.pause_cnt
        self.vector[1] = self.feedback.rewind_cnt

    def buildUnderstandingPart(self):
        self.vector[4] = self.feedback.understanding_difficulty

    def buildSpeedPart(self):
        self.vector[5] = self.feedback.speed_difficulty

    def getVector(self):
        return self.vector
