import logging
import time

logger = logging.getLogger(__name__)


class LoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        user = getattr(request, "user", "Anonymous")
        method = request.method
        path = request.get_full_path()

        logger.info(f"Incoming request: {method} {path} - User: {user}")

        response = self.get_response(request)

        duration = time.time() - start_time
        status_code = response.status_code

        logger.info(
            f"Outgoing response: {method} {path} - Status: {status_code} - Duration: {duration:.2f}s"
        )

        return response
