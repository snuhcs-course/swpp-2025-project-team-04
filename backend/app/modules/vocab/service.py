# app/modules/vocab/service.py
import asyncio
import json
import time
import os
from datetime import datetime
from openai import AsyncOpenAI
from dotenv import load_dotenv
from ...core.config import settings, SessionLocal
from ..audio import crud
from ...core.logger import logger


load_dotenv()
client = AsyncOpenAI(api_key=settings.openai_api_key)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "contextual_vocab")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class VocabService:
    _running_tasks = {}

    
    @staticmethod
    async def process_sentence_async(index: int, sentence: str):
        prompt = f"""
        You are an advanced English morphological and semantic analyzer.

        Your task is to analyze the following English sentence and create a contextual bilingual (English–Korean) vocabulary list.

        For each **unique word** appearing in the sentence (case-insensitive, no duplicates),
        return its:
        - "word": the **exact form** as it appears in the sentence (do not lemmatize or change it)
        - "pos": the part of speech in Korean (명사, 동사, 형용사, 부사, 전치사, 대명사, 접속사, 조동사, 관사, 감탄사 등)
        - "meaning": a short Korean meaning **that reflects the context**, and if the word is not in its base form (e.g., plural, past tense, etc.), naturally mention that (e.g., “run의 과거형, 달리다”).  
        If it’s already in base form, omit that note.

        Output strictly in the following JSON format:

        {{
        "entries": [
            {{
            "word": "실제 문장에 등장한 단어 그대로",
            "pos": "한국어 품사",
            "meaning": "문맥을 반영한 간결한 한국어 뜻 (필요 시 형태소 정보 포함)"
            }}
        ]
        }}

        Do not omit any word that appears in the sentence.
        Do not include comments or explanations outside JSON.

        Sentence:
        {sentence}
        """

        try:
            start = time.time()
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            elapsed = time.time() - start

            content = response.choices[0].message.content.strip()
            data = json.loads(content)
            logger.info(f"[Sentence {index+1:02d}] ✅ Done in {elapsed:.2f}s")

            return {
                "index": index,
                "text": sentence,
                "words": data.get("entries", [])
            }

        except Exception as e:
            logger.warning(f"[Sentence {index+1:02d}] ❌ Error: {e}")
            return {
                "index": index,
                "text": sentence,
                "error": str(e),
                "words": []
            }

    @staticmethod
    async def build_contextual_vocab(sentences: list[str], generated_content_id: int):
        
        # preventing multiple execution
        if generated_content_id in VocabService._running_tasks:
            task = VocabService._running_tasks[generated_content_id]
            if not task.done():
                logger.warning(f"Skipping duplicate vocab build for content_id={generated_content_id}")
                return
        
        logger.info(f"✅ Starting async processing for {len(sentences)} sentences (content_id={generated_content_id})...")
        start_total = time.time()  
        tasks = [asyncio.create_task(VocabService.process_sentence_async(i, s)) for i, s in enumerate(sentences)]
        results = await asyncio.gather(*tasks)
        results_sorted = sorted(results, key=lambda x: x["index"])
        logger.info("✅ All sentences processed successfully!")

        merged_words_result = {"sentences": results_sorted}


        # db update
        try:
            db = SessionLocal()
            updated = crud.update_generated_content_vocabs(
                db,
                content_id=generated_content_id,
                script_vocabs=merged_words_result,
            )
            if updated:
                logger.info(f"DB Updated script_vocabs for content_id={generated_content_id}")
            else:
                logger.warning(f"No matching content_id={generated_content_id} found in DB")
        except Exception as e:
            logger.warning(f"Failed to update script_vocabs in DB: {e}")
        finally:
            db.close()

        total_elapsed = time.time() - start_total
        logger.info(f"[TIMER] 🧾Total contextual vocab pipeline took {total_elapsed:.2f}s\n")

        return merged_words_result
