from abc import ABC, abstractmethod

class InputVectorBuilder(ABC):

    @abstractmethod
    def buildVocabPart(self):
        pass

    @abstractmethod
    def buildInteractionPart(self):
        pass

    @abstractmethod
    def buildUnderstandingPart(self):
        pass

    @abstractmethod
    def buildSpeedPart(self):
        pass

    @abstractmethod
    def getVector(self) -> list:
        pass
