from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from . import schemas


router = APIRouter(prefix="/auth", tags=["auth"])