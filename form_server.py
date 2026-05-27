import logging
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
OWNER_CHAT_ID = os.getenv("OWNER_CHAT_ID", "437862772")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://grunvald.qzz.io")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 5
RATE_WINDOW = 60.0


def check_rate_limit(ip: str) -> bool:
    now = time.monotonic()
    timestamps = _rate_store[ip]
    _rate_store[ip] = [t for t in timestamps if now - t < RATE_WINDOW]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return False
    _rate_store[ip].append(now)
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN, "http://localhost"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class ContactForm(BaseModel):
    name: str
    contact: str
    message: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name is required")
        if len(v) > 100:
            raise ValueError("name too long")
        return v

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("contact is required")
        if len(v) > 200:
            raise ValueError("contact too long")
        return v

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message is required")
        if len(v) > 4000:
            raise ValueError("message too long")
        return v


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/contact")
async def contact(request: Request, form: ContactForm):
    ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Too many requests")

    text = (
        f"Новая заявка с grunvald.qzz.io\n\n"
        f"Имя: {form.name}\n"
        f"Контакт: {form.contact}\n\n"
        f"Задача:\n{form.message}"
    )

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": OWNER_CHAT_ID, "text": text}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
        logger.info("Telegram notification sent for %s", form.name)
    except Exception as exc:
        logger.error("Failed to send Telegram notification: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to deliver notification")

    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("form_server:app", host="127.0.0.1", port=8765, reload=False)
