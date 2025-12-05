from sqlalchemy.orm import Session
from typing import List
from .model import VocabEntry


def add_vocab_entry(
    db: Session,
    *,
    user_id: int,
    word: str,
    example_sentence: str | None = None,
    pos: str | None = None,
    meaning: str | None = None,
    example_sentence_url: str | None = None,
) -> VocabEntry:
    # normalize word to lowercase for consistent storage and matching
    normalized_word = word.strip().lower() if isinstance(word, str) else word

    entry = VocabEntry(
        user_id=user_id,
        word=normalized_word,
        example_sentence=example_sentence,
        pos=pos,
        meaning=meaning,
        example_sentence_url=example_sentence_url,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_vocab_for_user(db: Session, user_id: int) -> List[VocabEntry]:
    return (
        db.query(VocabEntry)
        .filter(VocabEntry.user_id == user_id)
        .order_by(VocabEntry.created_at.desc())
        .all()
    )


def delete_vocab_entry(db: Session, *, entry_id: int, user_id: int) -> bool:
    """Delete a vocab entry if it belongs to the specified user.

    Returns:
        bool: True if entry was found and deleted, False if not found
    """
    result = (
        db.query(VocabEntry)
        .filter(VocabEntry.id == entry_id, VocabEntry.user_id == user_id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return result > 0
