import urllib.parse
from typing import AsyncGenerator
import httpx
from fastapi import HTTPException, Request, Response
from fastapi.responses import StreamingResponse

ALLOWED_DOMAINS = [
    "audio-ssl.itunes.apple.com",
    "apple.com",
    "mzstatic.com"
]

def is_allowed_audio_url(url_str: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower()
        for allowed in ALLOWED_DOMAINS:
            if hostname == allowed or hostname.endswith("." + allowed):
                return True
        return False
    except Exception:
        return False

async def proxy_audio_stream(url: str, request: Request) -> Response:
    if not is_allowed_audio_url(url):
        raise HTTPException(status_code=403, detail="Forbidden audio host. Only Apple Music / iTunes preview hosts are permitted.")

    # Forward client Range header if requested
    req_headers = {}
    client_range = request.headers.get("range")
    if client_range:
        req_headers["Range"] = client_range

    client = httpx.AsyncClient(timeout=10.0, follow_redirects=True)
    try:
        upstream_req = client.build_request("GET", url, headers=req_headers)
        upstream_resp = await client.send(upstream_req, stream=True)

        async def stream_generator() -> AsyncGenerator[bytes, None]:
            try:
                async for chunk in upstream_resp.aiter_bytes(chunk_size=65536):
                    yield chunk
            finally:
                await upstream_resp.aclose()
                await client.aclose()

        response_headers = {
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Range, Content-Type, Accept",
            "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
            "Cache-Control": "public, max-age=86400",
        }

        if "content-range" in upstream_resp.headers:
            response_headers["Content-Range"] = upstream_resp.headers["content-range"]
        if "content-length" in upstream_resp.headers:
            response_headers["Content-Length"] = upstream_resp.headers["content-length"]
        content_type = upstream_resp.headers.get("content-type", "audio/mp4")
        response_headers["Content-Type"] = content_type

        return StreamingResponse(
            stream_generator(),
            status_code=upstream_resp.status_code,
            headers=response_headers,
            media_type=content_type
        )
    except httpx.HTTPError as e:
        await client.aclose()
        raise HTTPException(status_code=502, detail=f"Error streaming upstream audio: {e}")
