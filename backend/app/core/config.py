from typing import Optional

from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    app_name: str = "LingoFit"
    debug: bool = False
    db_user: str
    db_password: str
    db_host: str
    db_name: str
    secret_key: str
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str | None = None
    aws_s3_bucket: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}/{settings.db_name}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # auto connection
    pool_recycle=1800,    
    pool_size=10,        
    max_overflow=20    
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def apply_startup_migrations():
    """Minimal, idempotent schema sync to keep CI database aligned with models."""
    if engine.dialect.name != "mysql":
        return

    with engine.begin() as conn:
        inspector = inspect(conn)

        user_columns = {column["name"] for column in inspector.get_columns("users")}
        # --- Advanced level system fields ---
        if "lexical_level" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN lexical_level DECIMAL(4, 1) NOT NULL DEFAULT 0.0"))
        if "syntactic_level" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN syntactic_level DECIMAL(4, 1) NOT NULL DEFAULT 0.0"))
        if "speed_level" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN speed_level DECIMAL(4, 1) NOT NULL DEFAULT 0.0"))

        if "initial_level_completed" not in user_columns:
            conn.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN initial_level_completed TINYINT(1) NOT NULL DEFAULT 0"
                )
            )
        if "level_score" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN level_score INT NULL"))
        if "llm_confidence" not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN llm_confidence INT NULL"))

        history_columns = {
            column["name"] for column in inspector.get_columns("user_level_history")
        }
        if "level_score" not in history_columns:
            conn.execute(
                text("ALTER TABLE user_level_history ADD COLUMN level_score INT NULL")
            )
        if "llm_confidence" not in history_columns:
            conn.execute(
                text("ALTER TABLE user_level_history ADD COLUMN llm_confidence INT NULL")
            )
        if "average_understanding" not in history_columns:
            conn.execute(
                text(
                    "ALTER TABLE user_level_history "
                    "ADD COLUMN average_understanding INT NULL"
                )
            )
        if "sample_count" not in history_columns:
            conn.execute(
                text("ALTER TABLE user_level_history ADD COLUMN sample_count INT NULL")
            )

        # --- Ensure FK constraints referencing users use ON DELETE CASCADE ---
        # For tables that reference users.id, alter the foreign key to cascade on delete.
        # This mimics the lightweight startup-migration approach used elsewhere.
        tables_with_user_fk = [
            "generated_contents",
            "vocab_entries",
            "user_level_history",
            "study_sessions",
            "user_achievements",
        ]

        for tbl in tables_with_user_fk:
            try:
                fks = inspector.get_foreign_keys(tbl)
            except Exception:
                # table may not exist yet in CI/dev DB; skip
                continue

            for fk in fks:
                # identify FKs that reference users(id)
                referred_table = fk.get("referred_table") or fk.get("referred_table_name")
                constrained_columns = fk.get("constrained_columns") or fk.get("constrained_column")
                if not referred_table or not constrained_columns:
                    continue
                if referred_table != "users":
                    continue
                if "user_id" not in constrained_columns:
                    continue

                fk_name = fk.get("name")
                if not fk_name:
                    # fallback: construct a name (not ideal) - skip if unnamed
                    continue

                # Check current ON DELETE rule via information_schema
                try:
                    row = conn.execute(
                        text(
                            "SELECT DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS "
                            "WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = :name AND TABLE_NAME = :table"
                        ),
                        {"name": fk_name, "table": tbl},
                    ).fetchone()
                except Exception:
                    row = None

                delete_rule = row[0] if row and len(row) > 0 else None

                if delete_rule == "CASCADE":
                    # already correct — log and continue
                    print(f"[startup-migrate] FK `{fk_name}` on `{tbl}` already uses ON DELETE CASCADE")
                    continue

                # Drop and re-create FK with ON DELETE CASCADE
                try:
                    conn.execute(text(f"ALTER TABLE `{tbl}` DROP FOREIGN KEY `{fk_name}`"))
                    conn.execute(
                        text(
                            f"ALTER TABLE `{tbl}` ADD CONSTRAINT `{fk_name}` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE"
                        )
                    )
                    print(f"[startup-migrate] altered FK `{fk_name}` on `{tbl}` to ON DELETE CASCADE")
                except Exception as e:
                    # Best-effort: log and continue; CI/dev environments may differ
                    print(f"[startup-migrate] failed to alter FK {fk_name} on {tbl}: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
