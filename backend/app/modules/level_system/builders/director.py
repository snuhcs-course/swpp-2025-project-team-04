from .interface import InputVectorBuilder

class Director:
    def __init__(self, builder: InputVectorBuilder):
        self.builder = builder

    def buildInputVector(self):
        self.builder.buildVocabPart()
        self.builder.buildInteractionPart()
        self.builder.buildUnderstandingPart()
        self.builder.buildSpeedPart()
        return self.builder.getVector()