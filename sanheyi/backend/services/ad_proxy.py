import os
from typing import List, Optional

import httpx

AD_REMOTE_URL = os.environ.get(
    "AD_REMOTE_URL",
    "https://api-web.kunqiongai.com/soft_desktop/get_adv"
)
DEFAULT_SOFT_NUMBER = os.environ.get("AD_SOFT_NUMBER", "10011")
AD_REQUEST_TIMEOUT = float(os.environ.get("AD_REQUEST_TIMEOUT", 5.0))


async def fetch_ads(position: str, soft_number: Optional[str] = None) -> List[dict]:
    payload = {
        "soft_number": soft_number or DEFAULT_SOFT_NUMBER,
        "adv_position": position
    }

    async with httpx.AsyncClient(timeout=AD_REQUEST_TIMEOUT) as client:
        response = await client.post(
            AD_REMOTE_URL,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()

    data = response.json()
    if isinstance(data, dict) and data.get("code") == 1:
        ads = data.get("data")
        if isinstance(ads, list):
            return ads
    return []
